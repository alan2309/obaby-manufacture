import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { AssignRollDto } from './dto/assign-roll.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';

@Controller('batches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  findAll() {
    return this.batchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBatchDto) {
    return this.batchesService.create(dto);
  }

  @Post(':id/rolls')
  assignRoll(@Param('id') id: string, @Body() dto: AssignRollDto) {
    return this.batchesService.assignRoll(id, dto);
  }

  @Delete(':id/rolls/:rollId')
  removeRoll(@Param('id') id: string, @Param('rollId') rollId: string) {
    return this.batchesService.removeRoll(id, rollId);
  }

  @Post(':id/cutting-worker')
  assignCuttingWorker(@Param('id') id: string, @Body() dto: AssignWorkerDto) {
    return this.batchesService.assignCuttingWorker(id, dto);
  }

  @Post(':id/stitching-worker')
  assignStitchingWorker(@Param('id') id: string, @Body() dto: AssignWorkerDto) {
    return this.batchesService.assignStitchingWorker(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.batchesService.cancel(id);
  }
}
