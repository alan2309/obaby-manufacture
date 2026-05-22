import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AuditModule } from '../audit/audit.module';
import { CuttingController } from './cutting.controller';
import { CuttingService } from './cutting.service';

@Module({
  imports: [AuthModule, InventoryModule, AuditModule],
  controllers: [CuttingController],
  providers: [CuttingService],
  exports: [CuttingService],
})
export class CuttingModule {}
