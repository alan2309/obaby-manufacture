import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnterStitchingDto } from './dto/enter-stitching.dto';
import { AdminEditStitchingDto } from './dto/admin-edit-stitching.dto';

@Injectable()
export class StitchingService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyBatches(userId: string) {
    return this.prisma.productionBatch.findMany({
      where: {
        stitchingWorkerId: userId,
        status: { in: ['STITCHING_ASSIGNED', 'STITCHING_IN_PROGRESS'] },
      },
      include: {
        product: true,
        stitchingOutputs: true,
        cuttingOutputs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatchDetail(batchId: string, userId: string) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
      include: {
        product: true,
        stitchingOutputs: true,
        cuttingOutputs: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.stitchingWorkerId !== userId) {
      throw new ForbiddenException('This batch is not assigned to you');
    }

    return batch;
  }

  async enterQuantity(batchId: string, userId: string, dto: EnterStitchingDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
      include: { cuttingOutputs: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.stitchingWorkerId !== userId) {
      throw new ForbiddenException('This batch is not assigned to you');
    }

    if (
      !['STITCHING_ASSIGNED', 'STITCHING_IN_PROGRESS'].includes(batch.status)
    ) {
      throw new BadRequestException(
        'Batch must be in STITCHING_ASSIGNED or STITCHING_IN_PROGRESS status',
      );
    }

    // Validate quantity does not exceed cutting output for that size
    const cuttingOutput = batch.cuttingOutputs.find(
      (co) => co.size === dto.size,
    );
    const maxQuantity = cuttingOutput ? cuttingOutput.quantity : 0;

    if (dto.quantity > maxQuantity) {
      throw new BadRequestException(
        `Quantity cannot exceed cutting output for size ${dto.size} (max: ${maxQuantity})`,
      );
    }

    // Transition to STITCHING_IN_PROGRESS if currently STITCHING_ASSIGNED
    if (batch.status === 'STITCHING_ASSIGNED') {
      await this.prisma.productionBatch.update({
        where: { id: batchId },
        data: { status: 'STITCHING_IN_PROGRESS' },
      });
    }

    // Upsert stitching output for (batchId, size)
    return this.prisma.stitchingOutput.upsert({
      where: { batchId_size: { batchId, size: dto.size } },
      update: { quantity: dto.quantity },
      create: { batchId, size: dto.size, quantity: dto.quantity },
    });
  }

  async completeStitching(batchId: string, userId: string) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
      include: { stitchingOutputs: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.stitchingWorkerId !== userId) {
      throw new ForbiddenException('This batch is not assigned to you');
    }

    if (batch.status !== 'STITCHING_IN_PROGRESS') {
      throw new BadRequestException(
        'Batch must be in STITCHING_IN_PROGRESS status',
      );
    }

    if (batch.stitchingOutputs.length === 0) {
      throw new BadRequestException(
        'At least one stitching output must be entered before completing',
      );
    }

    // Transition to STITCHING_DONE
    await this.prisma.productionBatch.update({
      where: { id: batchId },
      data: { status: 'STITCHING_DONE' },
    });

    return { message: 'Stitching completed successfully' };
  }

  async adminEditQuantity(batchId: string, dto: AdminEditStitchingDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const allowedStatuses = [
      'STITCHING_DONE',
      'IRONING_IN_PROGRESS',
      'COMPLETED',
    ];

    if (!allowedStatuses.includes(batch.status)) {
      throw new BadRequestException(
        'Batch must be in STITCHING_DONE or later status',
      );
    }

    return this.prisma.stitchingOutput.upsert({
      where: { batchId_size: { batchId, size: dto.size } },
      update: { quantity: dto.quantity },
      create: { batchId, size: dto.size, quantity: dto.quantity },
    });
  }
}
