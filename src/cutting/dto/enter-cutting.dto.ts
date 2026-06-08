import { IsEnum, IsInt, Min } from 'class-validator';
import { Size } from '@prisma/client';

export class EnterCuttingDto {
  @IsEnum(Size)
  size: Size;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
