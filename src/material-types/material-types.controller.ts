import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { MaterialTypesService } from './material-types.service';
import { CreateMaterialTypeDto } from './dto/create-material-type.dto';
import { UpdateMaterialTypeDto } from './dto/update-material-type.dto';

@Controller('material-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MaterialTypesController {
  constructor(private readonly materialTypesService: MaterialTypesService) {}

  @Get()
  findAll() {
    return this.materialTypesService.findAll();
  }

  @Post()
  create(@Body() createMaterialTypeDto: CreateMaterialTypeDto) {
    return this.materialTypesService.create(createMaterialTypeDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMaterialTypeDto: UpdateMaterialTypeDto,
  ) {
    return this.materialTypesService.update(id, updateMaterialTypeDto);
  }
}
