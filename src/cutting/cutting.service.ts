import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
import { EnterCuttingDto } from './dto/enter-cutting.dto';
import { EnterLeftoverDto } from './dto/enter-leftover.dto';
import { AdminEditQuantityDto } from './dto/admin-edit-quantity.dto';

@Injectable()
export class CuttingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
  ) {}

  async getMyBatches(userId: string) {
    return this.prisma.productionBatch.findMany({
      where: {
        cuttingWorkerId: userId,
        status: { in: ['CUTTING_ASSIGNED', 'CUTTING_IN_PROGRESS'] },
      },
      include: {
        product: true,
        rollAssignments: { include: { roll: true } },
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
        rollAssignments: { include: { roll: true } },
        cuttingOutputs: true,
        cuttingLeftover: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.cuttingWorkerId !== userId) {
      throw new ForbiddenException('This batch is not assigned to you');
    }

    return batch;
  }

  async enterQuantity(batchId: string, userId: string, dto: EnterCuttingDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.cuttingWorkerId !== userId) {
      throw new ForbiddenException('This batch is not assigned to you');
    }

    if (!['CUTTING_ASSIGNED', 'CUTTING_IN_PROGRESS'].includes(batch.status)) {
      throw new BadRequestException(
        'Batch must be in CUTTING_ASSIGNED or CUTTING_IN_PROGRESS status',
      );
    }

    // Transition to CUTTING_IN_PROGRESS if currently CUTTING_ASSIGNED
    if (batch.status === 'CUTTING_ASSIGNED') {
      await this.prisma.productionBatch.update({
        where: { id: batchId },
        data: { status: 'CUTTING_IN_PROGRESS' },
      });
    }

    // Upsert cutting output for (batchId, size)
    return this.prisma.cuttingOutput.upsert({
      where: { batchId_size: { batchId, size: dto.size } },
      update: { quantity: dto.quantity },
      create: { batchId, size: dto.size, quantity: dto.quantity },
    });
  }

  async enterLeftover(batchId: string, userId: string, dto: EnterLeftoverDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.cuttingWorkerId !== userId) {
      throw new ForbiddenException('This batch is not assigned to you');
    }

    if (batch.status !== 'CUTTING_IN_PROGRESS') {
      throw new BadRequestException(
        'Batch must be in CUTTING_IN_PROGRESS status',
      );
    }

    // Upsert cutting leftover for batchId
    return this.prisma.cuttingLeftover.upsert({
      where: { batchId },
      update: { leftoverMeters: dto.leftoverMeters },
      create: { batchId, leftoverMeters: dto.leftoverMeters },
    });
  }

  async completeCutting(batchId: string, userId: string) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
      include: {
        cuttingOutputs: true,
        cuttingLeftover: true,
        rollAssignments: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.cuttingWorkerId !== userId) {
      throw new ForbiddenException('This batch is not assigned to you');
    }

    if (batch.status !== 'CUTTING_IN_PROGRESS') {
      throw new BadRequestException(
        'Batch must be in CUTTING_IN_PROGRESS status',
      );
    }

    if (batch.cuttingOutputs.length === 0) {
      throw new BadRequestException(
        'At least one cutting output must be entered before completing',
      );
    }

    // Transition to CUTTING_DONE
    await this.prisma.productionBatch.update({
      where: { id: batchId },
      data: { status: 'CUTTING_DONE' },
    });

    // If leftover exists, process it for each assigned roll
    if (batch.cuttingLeftover) {
      const leftoverPerRoll =
        batch.rollAssignments.length > 0
          ? batch.cuttingLeftover.leftoverMeters / batch.rollAssignments.length
          : 0;

      for (const assignment of batch.rollAssignments) {
        await this.inventoryService.processLeftover(
          assignment.rollId,
          leftoverPerRoll,
          userId,
        );
      }
    }

    return { message: 'Cutting completed successfully' };
  }

  async adminEditQuantity(batchId: string, dto: AdminEditQuantityDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const allowedStatuses = [
      'CUTTING_DONE',
      'STITCHING_ASSIGNED',
      'STITCHING_IN_PROGRESS',
      'STITCHING_DONE',
      'IRONING_IN_PROGRESS',
      'COMPLETED',
    ];

    if (!allowedStatuses.includes(batch.status)) {
      throw new BadRequestException(
        'Batch must be in CUTTING_DONE or later status',
      );
    }

    // Update or create the cutting output
    const output = await this.prisma.cuttingOutput.upsert({
      where: { batchId_size: { batchId, size: dto.size } },
      update: { quantity: dto.quantity },
      create: { batchId, size: dto.size, quantity: dto.quantity },
    });

    return output;
  }
}
