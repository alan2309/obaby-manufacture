import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitIroningDto } from './dto/submit-ironing.dto';

@Injectable()
export class IroningService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableStock() {
    const batches = await this.prisma.productionBatch.findMany({
      where: {
        status: { in: ['STITCHING_DONE', 'IRONING_IN_PROGRESS'] },
      },
      include: {
        product: true,
        stitchingOutputs: true,
        ironingEntries: true,
      },
    });

    const stockItems: Array<{
      batchId: string;
      batchCode: string;
      productName: string;
      size: string;
      stitchedQuantity: number;
      ironedQuantity: number;
      available: number;
    }> = [];

    for (const batch of batches) {
      for (const stitchingOutput of batch.stitchingOutputs) {
        const ironedQuantity = batch.ironingEntries
          .filter((entry) => entry.size === stitchingOutput.size)
          .reduce((sum, entry) => sum + entry.quantity, 0);

        const available = stitchingOutput.quantity - ironedQuantity;

        if (available > 0) {
          stockItems.push({
            batchId: batch.id,
            batchCode: batch.batchCode,
            productName: batch.product.name,
            size: stitchingOutput.size,
            stitchedQuantity: stitchingOutput.quantity,
            ironedQuantity,
            available,
          });
        }
      }
    }

    return stockItems;
  }

  async submitIroning(userId: string, dto: SubmitIroningDto) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: dto.batchId },
      include: {
        stitchingOutputs: true,
        ironingEntries: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (!['STITCHING_DONE', 'IRONING_IN_PROGRESS'].includes(batch.status)) {
      throw new BadRequestException(
        'Batch must be in STITCHING_DONE or IRONING_IN_PROGRESS status',
      );
    }

    // Calculate available for (batchId, size)
    const stitchingOutput = batch.stitchingOutputs.find(
      (so) => so.size === dto.size,
    );
    const stitchedQuantity = stitchingOutput ? stitchingOutput.quantity : 0;

    const ironedQuantity = batch.ironingEntries
      .filter((entry) => entry.size === dto.size)
      .reduce((sum, entry) => sum + entry.quantity, 0);

    const available = stitchedQuantity - ironedQuantity;

    if (dto.quantity > available) {
      throw new BadRequestException(
        `Cannot iron more than available quantity (available: ${available})`,
      );
    }

    // Create IroningEntry
    const entry = await this.prisma.ironingEntry.create({
      data: {
        batchId: dto.batchId,
        size: dto.size,
        quantity: dto.quantity,
        workerId: userId,
      },
    });

    // If batch status is STITCHING_DONE, transition to IRONING_IN_PROGRESS
    if (batch.status === 'STITCHING_DONE') {
      await this.prisma.productionBatch.update({
        where: { id: dto.batchId },
        data: { status: 'IRONING_IN_PROGRESS' },
      });
    }

    // Check if ALL sizes are fully ironed
    const updatedBatch = await this.prisma.productionBatch.findUnique({
      where: { id: dto.batchId },
      include: {
        stitchingOutputs: true,
        ironingEntries: true,
        rollAssignments: { include: { roll: true } },
      },
    });

    if (updatedBatch) {
      const allFullyIroned = updatedBatch.stitchingOutputs.every((so) => {
        const totalIroned = updatedBatch.ironingEntries
          .filter((ie) => ie.size === so.size)
          .reduce((sum, ie) => sum + ie.quantity, 0);
        return totalIroned >= so.quantity;
      });

      if (allFullyIroned && updatedBatch.stitchingOutputs.length > 0) {
        await this.prisma.productionBatch.update({
          where: { id: dto.batchId },
          data: { status: 'COMPLETED' },
        });

        // Auto-generate ledger entry for ironing worker
        const totalIronedQty = updatedBatch.ironingEntries
          .filter((ie) => ie.workerId === userId)
          .reduce((sum, ie) => sum + ie.quantity, 0);
        const materialTypeId = updatedBatch.rollAssignments[0]?.roll?.materialTypeId;
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        if (materialTypeId && totalIronedQty > 0) {
          await this.prisma.workerLedgerEntry.create({
            data: {
              workerId: userId,
              batchId: dto.batchId,
              materialTypeId,
              stage: 'IRONING',
              quantity: totalIronedQty,
              month,
            },
          });
        }
      }
    }

    return entry;
  }

  async getMyEntries(userId: string) {
    return this.prisma.ironingEntry.findMany({
      where: { workerId: userId },
      include: {
        batch: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
