import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { InventoryService } from './inventory.service';
import { CreateRollDto } from './dto/create-roll.dto';
import { UpdateRollDto } from './dto/update-roll.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Roll Endpoints ────────────────────────────────────────────

  @Get('rolls')
  findAllRolls(
    @Query('vendorId') vendorId?: string,
    @Query('materialTypeId') materialTypeId?: string,
    @Query('isAssigned') isAssigned?: string,
    @Query('color') color?: string,
  ) {
    const filters: any = {};
    if (vendorId) filters.vendorId = vendorId;
    if (materialTypeId) filters.materialTypeId = materialTypeId;
    if (isAssigned !== undefined) filters.isAssigned = isAssigned === 'true';
    if (color) filters.color = color;
    return this.inventoryService.findAllRolls(filters);
  }

  @Get('rolls/:id')
  findOneRoll(@Param('id') id: string) {
    return this.inventoryService.findOneRoll(id);
  }

  @Post('rolls')
  createRoll(@Body() dto: CreateRollDto, @Request() req: any) {
    return this.inventoryService.createRoll(dto, req.user.userId);
  }

  @Patch('rolls/:id')
  updateRoll(
    @Param('id') id: string,
    @Body() dto: UpdateRollDto,
    @Request() req: any,
  ) {
    return this.inventoryService.updateRoll(id, dto, req.user.userId);
  }

  @Get('rolls/:id/transactions')
  getRollTransactions(@Param('id') id: string) {
    return this.inventoryService.getTransactions(id);
  }
}
