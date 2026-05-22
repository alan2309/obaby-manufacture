import { IsEnum, IsInt, Min } from 'class-validator';
import { Size } from '@prisma/client';

export class AdminEditQuantityDto {
  @IsEnum(Size)
  size: Size;

  @IsInt()
  @Min(0)
  quantity: number;
}
