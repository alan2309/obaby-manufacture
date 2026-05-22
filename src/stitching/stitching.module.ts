import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StitchingController } from './stitching.controller';
import { StitchingService } from './stitching.service';

@Module({
  imports: [AuthModule],
  controllers: [StitchingController],
  providers: [StitchingService],
  exports: [StitchingService],
})
export class StitchingModule {}
