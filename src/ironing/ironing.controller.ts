import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { IroningService } from './ironing.service';
import { SubmitIroningDto } from './dto/submit-ironing.dto';

@Controller('ironing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IroningController {
  constructor(private readonly ironingService: IroningService) {}

  @Get('available-stock')
  @Roles(Role.IRON, Role.ADMIN)
  getAvailableStock() {
    return this.ironingService.getAvailableStock();
  }

  @Post('submit')
  @Roles(Role.IRON, Role.ADMIN)
  submitIroning(@Body() dto: SubmitIroningDto, @Request() req: any) {
    return this.ironingService.submitIroning(req.user.userId, dto);
  }

  @Get('my-entries')
  @Roles(Role.IRON, Role.ADMIN)
  getMyEntries(@Request() req: any) {
    return this.ironingService.getMyEntries(req.user.userId);
  }
}
