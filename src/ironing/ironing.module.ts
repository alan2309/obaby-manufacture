import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IroningController } from './ironing.controller';
import { IroningService } from './ironing.service';

@Module({
  imports: [AuthModule],
  controllers: [IroningController],
  providers: [IroningService],
  exports: [IroningService],
})
export class IroningModule {}
