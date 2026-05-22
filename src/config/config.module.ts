import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { AppConfigService } from './config.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
