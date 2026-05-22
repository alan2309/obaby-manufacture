import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async createInventoryTransaction(
    rollId: string,
    oldValue: number,
    newValue: number,
    reason: string,
    userId: string,
  ) {
    return this.prisma.inventoryTransaction.create({
      data: {
        rollId,
        oldValue,
        newValue,
        reason,
        userId,
      },
    });
  }

  async createAuditLog(params: {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      },
    });
  }

  async getAuditLogs(filters?: {
    userId?: string;
    entity?: string;
    entityId?: string;
  }) {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.entityId) where.entityId = filters.entityId;

    return this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
