import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { AssignRollDto } from './dto/assign-roll.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';

@Injectable()
export class BatchesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly batchIncludes = {
    product: true,
    rollAssignments: { include: { roll: true } },
    cuttingWorker: true,
    stitchingWorker: true,
  };

  async findAll() {
    return this.prisma.productionBatch.findMany({
      include: this.batchIncludes,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id },
      include: this.batchIncludes,
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    return batch;
  }

  async create(dto: CreateBatchDto) {
    // Validate product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    try {
      return await this.prisma.productionBatch.create({
        data: {
          batchCode: dto.batchCode,
          productId: dto.productId,
          status: 'DRAFT',
        },
        include: this.batchIncludes,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Batch code already exists');
      }
      throw error;
    }
  }

  async assignRoll(batchId: string, dto: AssignRollDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    if (!['DRAFT', 'CUTTING_ASSIGNED'].includes(batch.status)) {
      throw new BadRequestException(
        'Rolls can only be assigned when batch is in DRAFT or CUTTING_ASSIGNED status',
      );
    }

    // Validate roll exists and is not already assigned
    const roll = await this.prisma.inventoryRoll.findUnique({
      where: { id: dto.rollId },
    });
    if (!roll) {
      throw new NotFoundException('Roll not found');
    }
    if (roll.isAssigned) {
      throw new ConflictException('Roll is already assigned');
    }

    // Create assignment and mark roll as assigned
    await this.prisma.batchRollAssignment.create({
      data: { batchId, rollId: dto.rollId },
    });
    await this.prisma.inventoryRoll.update({
      where: { id: dto.rollId },
      data: { isAssigned: true },
    });

    return this.findOne(batchId);
  }

  async removeRoll(batchId: string, rollId: string) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    if (batch.status !== 'DRAFT') {
      throw new BadRequestException(
        'Rolls can only be removed when batch is in DRAFT status',
      );
    }

    // Find and delete the assignment
    const assignment = await this.prisma.batchRollAssignment.findUnique({
      where: { batchId_rollId: { batchId, rollId } },
    });
    if (!assignment) {
      throw new NotFoundException('Roll assignment not found');
    }

    await this.prisma.batchRollAssignment.delete({
      where: { id: assignment.id },
    });
    await this.prisma.inventoryRoll.update({
      where: { id: rollId },
      data: { isAssigned: false },
    });

    return this.findOne(batchId);
  }

  async assignCuttingWorker(batchId: string, dto: AssignWorkerDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    if (batch.status !== 'DRAFT') {
      throw new BadRequestException(
        'Cutting worker can only be assigned when batch is in DRAFT status',
      );
    }
    if (batch.cuttingWorkerId) {
      throw new ConflictException('Cutting worker already assigned');
    }

    // Validate worker has CUTTING role
    const worker = await this.prisma.user.findUnique({
      where: { id: dto.workerId },
    });
    if (!worker) {
      throw new NotFoundException('Worker not found');
    }
    if (worker.role !== 'CUTTING') {
      throw new BadRequestException('Worker does not have CUTTING role');
    }

    return this.prisma.productionBatch.update({
      where: { id: batchId },
      data: {
        cuttingWorkerId: dto.workerId,
        status: 'CUTTING_ASSIGNED',
      },
      include: this.batchIncludes,
    });
  }

  async assignStitchingWorker(batchId: string, dto: AssignWorkerDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    if (batch.status !== 'CUTTING_DONE') {
      throw new BadRequestException(
        'Stitching worker can only be assigned when batch is in CUTTING_DONE status',
      );
    }
    if (batch.stitchingWorkerId) {
      throw new ConflictException('Stitching worker already assigned');
    }

    // Validate worker has STITCHING role
    const worker = await this.prisma.user.findUnique({
      where: { id: dto.workerId },
    });
    if (!worker) {
      throw new NotFoundException('Worker not found');
    }
    if (worker.role !== 'STITCHING') {
      throw new BadRequestException('Worker does not have STITCHING role');
    }

    return this.prisma.productionBatch.update({
      where: { id: batchId },
      data: {
        stitchingWorkerId: dto.workerId,
        status: 'STITCHING_ASSIGNED',
      },
      include: this.batchIncludes,
    });
  }

  async cancel(batchId: string) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
      include: { rollAssignments: true },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    if (['COMPLETED', 'CANCELLED'].includes(batch.status)) {
      throw new BadRequestException(
        'Cannot cancel a batch that is already completed or cancelled',
      );
    }

    // Release all assigned rolls
    for (const assignment of batch.rollAssignments) {
      await this.prisma.inventoryRoll.update({
        where: { id: assignment.rollId },
        data: { isAssigned: false },
      });
    }

    return this.prisma.productionBatch.update({
      where: { id: batchId },
      data: { status: 'CANCELLED' },
      include: this.batchIncludes,
    });
  }
}
