import { Module } from '@nestjs/common';
import { MaterialTypesController } from './material-types.controller';
import { MaterialTypesService } from './material-types.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MaterialTypesController],
  providers: [MaterialTypesService],
})
export class MaterialTypesModule {}
