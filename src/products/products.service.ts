import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXL3', 'XXL4', 'XXL5'];

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateSizeRange(from: string, to: string) {
    if (SIZE_ORDER.indexOf(from) >= SIZE_ORDER.indexOf(to)) {
      throw new BadRequestException(
        'sizeRangeFrom must be smaller than sizeRangeTo',
      );
    }
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { materials: { include: { materialType: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { materials: { include: { materialType: true } } },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    this.validateSizeRange(dto.sizeRangeFrom, dto.sizeRangeTo);

    // Validate all materialTypeIds exist
    const materialTypes = await this.prisma.materialType.findMany({
      where: { id: { in: dto.materialTypeIds } },
    });
    if (materialTypes.length !== dto.materialTypeIds.length) {
      throw new NotFoundException('One or more material types not found');
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category,
        sizeRangeFrom: dto.sizeRangeFrom,
        sizeRangeTo: dto.sizeRangeTo,
        imageUrl: dto.imageUrl,
        materials: {
          create: dto.materialTypeIds.map((materialTypeId) => ({
            materialTypeId,
          })),
        },
      },
      include: { materials: { include: { materialType: true } } },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    // Validate size range if either is provided
    const from = dto.sizeRangeFrom || existing.sizeRangeFrom;
    const to = dto.sizeRangeTo || existing.sizeRangeTo;
    if (dto.sizeRangeFrom || dto.sizeRangeTo) {
      this.validateSizeRange(from, to);
    }

    // Update product fields
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.sizeRangeFrom !== undefined && { sizeRangeFrom: dto.sizeRangeFrom }),
        ...(dto.sizeRangeTo !== undefined && { sizeRangeTo: dto.sizeRangeTo }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      },
      include: { materials: { include: { materialType: true } } },
    });

    // Sync materials if materialTypeIds provided
    if (dto.materialTypeIds) {
      // Validate all materialTypeIds exist
      const materialTypes = await this.prisma.materialType.findMany({
        where: { id: { in: dto.materialTypeIds } },
      });
      if (materialTypes.length !== dto.materialTypeIds.length) {
        throw new NotFoundException('One or more material types not found');
      }

      // Delete existing and recreate
      await this.prisma.productMaterial.deleteMany({ where: { productId: id } });
      await this.prisma.productMaterial.createMany({
        data: dto.materialTypeIds.map((materialTypeId) => ({
          productId: id,
          materialTypeId,
        })),
      });

      return this.prisma.product.findUnique({
        where: { id },
        include: { materials: { include: { materialType: true } } },
      });
    }

    return updated;
  }

  async delete(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
      return { message: 'Product deleted' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
      throw error;
    }
  }
}
