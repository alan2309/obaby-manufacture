import { IsOptional, IsString } from 'class-validator';

export class UpdateMaterialTypeDto {
  @IsOptional()
  @IsString()
  name?: string;
}
