import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateMaterialTypeDto } from './dto/create-material-type.dto';
import { UpdateMaterialTypeDto } from './dto/update-material-type.dto';
import { CreateRollDto } from './dto/create-roll.dto';
import { UpdateRollDto } from './dto/update-roll.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Vendor CRUD ───────────────────────────────────────────────

  async createVendor(dto: CreateVendorDto) {
    return this.prisma.vendor.create({ data: dto });
  }

  async findAllVendors() {
    return this.prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOneVendor(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async updateVendor(id: string, dto: UpdateVendorDto) {
    try {
      return await this.prisma.vendor.update({ where: { id }, data: dto });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Vendor not found');
      }
      throw error;
    }
  }

  async deleteVendor(id: string) {
    try {
      await this.prisma.vendor.delete({ where: { id } });
      return { message: 'Vendor deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Vendor not found');
      }
      throw error;
    }
  }

  // ─── MaterialType CRUD ─────────────────────────────────────────

  async createMaterialType(dto: CreateMaterialTypeDto) {
    try {
      return await this.prisma.materialType.create({ data: dto });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Material type name already exists');
      }
      throw error;
    }
  }

  async findAllMaterialTypes() {
    return this.prisma.materialType.findMany({ orderBy: { name: 'asc' } });
  }

  async findOneMaterialType(id: string) {
    const materialType = await this.prisma.materialType.findUnique({
      where: { id },
    });
    if (!materialType) {
      throw new NotFoundException('Material type not found');
    }
    return materialType;
  }

  async updateMaterialType(id: string, dto: UpdateMaterialTypeDto) {
    try {
      return await this.prisma.materialType.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Material type not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Material type name already exists');
      }
      throw error;
    }
  }

  async deleteMaterialType(id: string) {
    try {
      await this.prisma.materialType.delete({ where: { id } });
      return { message: 'Material type deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Material type not found');
      }
      throw error;
    }
  }

  // ─── Roll CRUD ─────────────────────────────────────────────────

  async findAllRolls(filters?: {
    vendorId?: string;
    materialTypeId?: string;
    isAssigned?: boolean;
    color?: string;
  }) {
    const where: any = {};
    if (filters?.vendorId) where.vendorId = filters.vendorId;
    if (filters?.materialTypeId)
      where.materialTypeId = filters.materialTypeId;
    if (filters?.isAssigned !== undefined)
      where.isAssigned = filters.isAssigned;
    if (filters?.color)
      where.color = { contains: filters.color, mode: 'insensitive' };

    return this.prisma.inventoryRoll.findMany({
      where,
      include: { vendor: true, materialType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneRoll(id: string) {
    const roll = await this.prisma.inventoryRoll.findUnique({
      where: { id },
      include: { vendor: true, materialType: true, transactions: true },
    });
    if (!roll) {
      throw new NotFoundException('Roll not found');
    }
    return roll;
  }

  async createRoll(dto: CreateRollDto, userId: string) {
    // Validate vendorId exists
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Validate materialTypeId exists
    const materialType = await this.prisma.materialType.findUnique({
      where: { id: dto.materialTypeId },
    });
    if (!materialType) {
      throw new NotFoundException('Material type not found');
    }

    try {
      return await this.prisma.inventoryRoll.create({
        data: {
          rollCode: dto.rollCode,
          vendorId: dto.vendorId,
          materialTypeId: dto.materialTypeId,
          color: dto.color,
          shade: dto.shade,
          gsm: dto.gsm,
          initialMeters: dto.initialMeters,
          remainingMeters: dto.initialMeters,
          cost: dto.cost,
          purchaseDate: new Date(dto.purchaseDate),
        },
        include: { vendor: true, materialType: true },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Roll code already exists');
      }
      throw error;
    }
  }

  async updateRoll(id: string, dto: UpdateRollDto, userId: string) {
    // Fetch current roll to get old remainingMeters
    const currentRoll = await this.prisma.inventoryRoll.findUnique({
      where: { id },
    });
    if (!currentRoll) {
      throw new NotFoundException('Roll not found');
    }

    const updatedRoll = await this.prisma.inventoryRoll.update({
      where: { id },
      data: dto,
      include: { vendor: true, materialType: true },
    });

    // If remainingMeters changed, create audit transaction
    if (
      dto.remainingMeters !== undefined &&
      dto.remainingMeters !== currentRoll.remainingMeters
    ) {
      await this.auditService.createInventoryTransaction(
        id,
        currentRoll.remainingMeters,
        dto.remainingMeters,
        'Manual adjustment',
        userId,
      );
    }

    return updatedRoll;
  }

  // ─── Roll Assignment ───────────────────────────────────────────

  async assignRoll(id: string) {
    const roll = await this.prisma.inventoryRoll.findUnique({
      where: { id },
    });
    if (!roll) {
      throw new NotFoundException('Roll not found');
    }
    if (roll.isAssigned) {
      throw new ConflictException('Roll is already assigned');
    }
    return this.prisma.inventoryRoll.update({
      where: { id },
      data: { isAssigned: true },
    });
  }

  async releaseRoll(id: string) {
    const roll = await this.prisma.inventoryRoll.findUnique({
      where: { id },
    });
    if (!roll) {
      throw new NotFoundException('Roll not found');
    }
    return this.prisma.inventoryRoll.update({
      where: { id },
      data: { isAssigned: false },
    });
  }

  // ─── Transactions ──────────────────────────────────────────────

  async getTransactions(rollId: string) {
    const roll = await this.prisma.inventoryRoll.findUnique({
      where: { id: rollId },
    });
    if (!roll) {
      throw new NotFoundException('Roll not found');
    }
    return this.prisma.inventoryTransaction.findMany({
      where: { rollId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Process Leftover ──────────────────────────────────────────

  async processLeftover(rollId: string, leftoverMeters: number, userId: string) {
    const roll = await this.prisma.inventoryRoll.findUnique({
      where: { id: rollId },
    });
    if (!roll) {
      throw new NotFoundException('Roll not found');
    }

    // Get threshold from SystemConfig
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'leftover_threshold' },
    });
    const threshold = config ? parseFloat(config.value) : 0.5;

    if (leftoverMeters > threshold) {
      // Return leftover to inventory
      const newRemaining = roll.remainingMeters + leftoverMeters;
      await this.prisma.inventoryRoll.update({
        where: { id: rollId },
        data: { remainingMeters: newRemaining },
      });
      await this.auditService.createInventoryTransaction(
        rollId,
        roll.remainingMeters,
        newRemaining,
        'Leftover return',
        userId,
      );
    } else {
      // Record as waste
      await this.auditService.createInventoryTransaction(
        rollId,
        roll.remainingMeters,
        roll.remainingMeters,
        'Waste recorded',
        userId,
      );
    }
  }
}
