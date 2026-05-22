import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AppConfigService } from './config.service';
import { SetThresholdDto } from './dto/set-threshold.dto';

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ConfigController {
  constructor(private readonly configService: AppConfigService) {}

  @Get('leftover-threshold')
  async getLeftoverThreshold() {
    const value = await this.configService.getLeftoverThreshold();
    return { value };
  }

  @Put('leftover-threshold')
  async setLeftoverThreshold(@Body() dto: SetThresholdDto) {
    const value = await this.configService.setLeftoverThreshold(dto.value);
    return { value };
  }
}
