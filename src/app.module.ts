import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InventoryModule } from './inventory/inventory.module';
import { AuditModule } from './audit/audit.module';
import { VendorsModule } from './vendors/vendors.module';
import { MaterialTypesModule } from './material-types/material-types.module';
import { AppConfigModule } from './config/config.module';
import { ProductsModule } from './products/products.module';
import { BatchesModule } from './batches/batches.module';
import { CuttingModule } from './cutting/cutting.module';
import { StitchingModule } from './stitching/stitching.module';
import { IroningModule } from './ironing/ironing.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, InventoryModule, AuditModule, VendorsModule, MaterialTypesModule, AppConfigModule, ProductsModule, BatchesModule, CuttingModule, StitchingModule, IroningModule, PayrollModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
