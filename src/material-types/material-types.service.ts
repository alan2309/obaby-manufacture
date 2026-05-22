import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialTypeDto } from './dto/create-material-type.dto';
import { UpdateMaterialTypeDto } from './dto/update-material-type.dto';

@Injectable()
export class MaterialTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.materialType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateMaterialTypeDto) {
    try {
      return await this.prisma.materialType.create({
        data: { name: dto.name },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Material type name already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateMaterialTypeDto) {
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
}
