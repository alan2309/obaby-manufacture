import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vendor.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateVendorDto) {
    try {
      return await this.prisma.vendor.create({
        data: { name: dto.name },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Vendor name already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateVendorDto) {
    try {
      return await this.prisma.vendor.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Vendor not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Vendor name already exists');
      }
      throw error;
    }
  }
}
