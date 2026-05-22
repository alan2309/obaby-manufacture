import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { EditLedgerEntryDto } from './dto/edit-ledger-entry.dto';
import { SetRateDto } from './dto/set-rate.dto';
import { Stage } from '@prisma/client';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  async createLedgerEntry(dto: CreateLedgerEntryDto) {
    // Validate worker exists
    const worker = await this.prisma.user.findUnique({
      where: { id: dto.workerId },
    });
    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Validate batch exists
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id: dto.batchId },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Validate materialType exists
    const materialType = await this.prisma.materialType.findUnique({
      where: { id: dto.materialTypeId },
    });
    if (!materialType) {
      throw new NotFoundException('Material type not found');
    }

    const month = this.getCurrentMonth();

    return this.prisma.workerLedgerEntry.create({
      data: {
        workerId: dto.workerId,
        batchId: dto.batchId,
        materialTypeId: dto.materialTypeId,
        stage: dto.stage as Stage,
        quantity: dto.quantity,
        month,
      },
      include: {
        worker: { select: { id: true, name: true } },
        batch: { select: { id: true, batchCode: true } },
        materialType: { select: { id: true, name: true } },
      },
    });
  }


  async getLedgerEntries(filters?: {
    workerId?: string;
    month?: string;
    stage?: string;
  }) {
    const where: any = {};
    if (filters?.workerId) where.workerId = filters.workerId;
    if (filters?.month) where.month = filters.month;
    if (filters?.stage) where.stage = filters.stage as Stage;

    return this.prisma.workerLedgerEntry.findMany({
      where,
      include: {
        worker: { select: { id: true, name: true } },
        batch: { select: { id: true, batchCode: true } },
        materialType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async editLedgerEntry(id: string, dto: EditLedgerEntryDto) {
    const entry = await this.prisma.workerLedgerEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Ledger entry not found');
    }

    // Check if the month is already finalized for this worker
    const isFinalized = await this.isMonthFinalized(
      entry.workerId,
      entry.month,
    );
    if (isFinalized) {
      throw new BadRequestException(
        'Cannot edit entry for a finalized month',
      );
    }

    return this.prisma.workerLedgerEntry.update({
      where: { id },
      data: { quantity: dto.quantity },
      include: {
        worker: { select: { id: true, name: true } },
        batch: { select: { id: true, batchCode: true } },
        materialType: { select: { id: true, name: true } },
      },
    });
  }

  async setRate(dto: SetRateDto) {
    return this.prisma.monthlyRateTable.upsert({
      where: {
        materialTypeId_stage_month: {
          materialTypeId: dto.materialTypeId,
          stage: dto.stage as Stage,
          month: dto.month,
        },
      },
      update: { rate: dto.rate },
      create: {
        materialTypeId: dto.materialTypeId,
        stage: dto.stage as Stage,
        rate: dto.rate,
        month: dto.month,
      },
    });
  }

  async getRates(month: string) {
    return this.prisma.monthlyRateTable.findMany({
      where: { month },
      include: {
        materialType: { select: { id: true, name: true } },
      },
      orderBy: [{ materialTypeId: 'asc' }, { stage: 'asc' }],
    });
  }


  async calculatePayroll(workerId: string, month: string) {
    // Validate worker exists
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
    });
    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Get all ledger entries for worker in that month
    const entries = await this.prisma.workerLedgerEntry.findMany({
      where: { workerId, month },
      include: {
        materialType: { select: { id: true, name: true } },
      },
    });

    // Get all rates for the month
    const rates = await this.prisma.monthlyRateTable.findMany({
      where: { month },
    });

    // Build a rate lookup map
    const rateMap = new Map<string, number>();
    for (const rate of rates) {
      rateMap.set(`${rate.materialTypeId}_${rate.stage}`, rate.rate);
    }

    // Calculate amounts
    const breakdown = entries.map((entry) => {
      const rateKey = `${entry.materialTypeId}_${entry.stage}`;
      const rate = rateMap.get(rateKey) || 0;
      const amount = entry.quantity * rate;
      return {
        materialType: entry.materialType.name,
        materialTypeId: entry.materialTypeId,
        stage: entry.stage,
        quantity: entry.quantity,
        rate,
        amount,
      };
    });

    const totalEarnings = breakdown.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    return {
      workerId,
      workerName: worker.name,
      month,
      entries: breakdown,
      totalEarnings,
    };
  }

  async finalizePayroll(workerId: string, month: string) {
    // Validate no existing snapshot
    const existing = await this.prisma.payrollSnapshot.findUnique({
      where: { workerId_month: { workerId, month } },
    });
    if (existing) {
      throw new ConflictException(
        'Payroll already finalized for this worker and month',
      );
    }

    // Calculate payroll
    const payroll = await this.calculatePayroll(workerId, month);

    // Create snapshot
    return this.prisma.payrollSnapshot.create({
      data: {
        workerId,
        month,
        totalEarnings: payroll.totalEarnings,
        details: payroll.entries,
      },
      include: {
        worker: { select: { id: true, name: true } },
      },
    });
  }

  async getPayrollSnapshots(filters?: { workerId?: string; month?: string }) {
    const where: any = {};
    if (filters?.workerId) where.workerId = filters.workerId;
    if (filters?.month) where.month = filters.month;

    return this.prisma.payrollSnapshot.findMany({
      where,
      include: {
        worker: { select: { id: true, name: true } },
      },
      orderBy: { finalizedAt: 'desc' },
    });
  }

  async isMonthFinalized(workerId: string, month: string): Promise<boolean> {
    const snapshot = await this.prisma.payrollSnapshot.findUnique({
      where: { workerId_month: { workerId, month } },
    });
    return !!snapshot;
  }
}
