import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeftoverThreshold(): Promise<number> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'leftover_threshold' },
    });
    return config ? parseFloat(config.value) : 0.5;
  }

  async setLeftoverThreshold(value: number): Promise<number> {
    await this.prisma.systemConfig.upsert({
      where: { key: 'leftover_threshold' },
      update: { value: value.toString() },
      create: { key: 'leftover_threshold', value: value.toString() },
    });
    return value;
  }
}
