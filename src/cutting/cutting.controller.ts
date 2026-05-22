import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CuttingService } from './cutting.service';
import { EnterCuttingDto } from './dto/enter-cutting.dto';
import { EnterLeftoverDto } from './dto/enter-leftover.dto';
import { AdminEditQuantityDto } from './dto/admin-edit-quantity.dto';

@Controller('cutting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CuttingController {
  constructor(private readonly cuttingService: CuttingService) {}

  // ─── Cutting Worker Endpoints ──────────────────────────────────

  @Get('my-batches')
  @Roles(Role.CUTTING, Role.ADMIN)
  getMyBatches(@Request() req: any) {
    return this.cuttingService.getMyBatches(req.user.userId);
  }

  @Get('batches/:id')
  @Roles(Role.CUTTING, Role.ADMIN)
  getBatchDetail(@Param('id') id: string, @Request() req: any) {
    return this.cuttingService.getBatchDetail(id, req.user.userId);
  }

  @Post('batches/:id/quantities')
  @Roles(Role.CUTTING, Role.ADMIN)
  enterQuantity(
    @Param('id') id: string,
    @Body() dto: EnterCuttingDto,
    @Request() req: any,
  ) {
    return this.cuttingService.enterQuantity(id, req.user.userId, dto);
  }

  @Post('batches/:id/leftover')
  @Roles(Role.CUTTING, Role.ADMIN)
  enterLeftover(
    @Param('id') id: string,
    @Body() dto: EnterLeftoverDto,
    @Request() req: any,
  ) {
    return this.cuttingService.enterLeftover(id, req.user.userId, dto);
  }

  @Post('batches/:id/complete')
  @Roles(Role.CUTTING, Role.ADMIN)
  completeCutting(@Param('id') id: string, @Request() req: any) {
    return this.cuttingService.completeCutting(id, req.user.userId);
  }

  // ─── Admin Endpoint ────────────────────────────────────────────

  @Patch('batches/:id/quantities')
  @Roles(Role.ADMIN)
  adminEditQuantity(
    @Param('id') id: string,
    @Body() dto: AdminEditQuantityDto,
  ) {
    return this.cuttingService.adminEditQuantity(id, dto);
  }
}
