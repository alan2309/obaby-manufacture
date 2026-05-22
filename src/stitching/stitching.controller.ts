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
import { StitchingService } from './stitching.service';
import { EnterStitchingDto } from './dto/enter-stitching.dto';
import { AdminEditStitchingDto } from './dto/admin-edit-stitching.dto';

@Controller('stitching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StitchingController {
  constructor(private readonly stitchingService: StitchingService) {}

  @Get('my-batches')
  @Roles(Role.STITCHING, Role.ADMIN)
  getMyBatches(@Request() req: any) {
    return this.stitchingService.getMyBatches(req.user.userId);
  }

  @Get('batches/:id')
  @Roles(Role.STITCHING, Role.ADMIN)
  getBatchDetail(@Param('id') id: string, @Request() req: any) {
    return this.stitchingService.getBatchDetail(id, req.user.userId);
  }

  @Post('batches/:id/quantities')
  @Roles(Role.STITCHING, Role.ADMIN)
  enterQuantity(
    @Param('id') id: string,
    @Body() dto: EnterStitchingDto,
    @Request() req: any,
  ) {
    return this.stitchingService.enterQuantity(id, req.user.userId, dto);
  }

  @Post('batches/:id/complete')
  @Roles(Role.STITCHING, Role.ADMIN)
  completeStitching(@Param('id') id: string, @Request() req: any) {
    return this.stitchingService.completeStitching(id, req.user.userId);
  }

  // ─── Admin Endpoint ────────────────────────────────────────────

  @Patch('batches/:id/quantities')
  @Roles(Role.ADMIN)
  adminEditQuantity(
    @Param('id') id: string,
    @Body() dto: AdminEditStitchingDto,
  ) {
    return this.stitchingService.adminEditQuantity(id, dto);
  }
}
