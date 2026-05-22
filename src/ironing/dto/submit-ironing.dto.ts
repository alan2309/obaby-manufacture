import { IsString, IsNotEmpty, IsEnum, IsInt, Min } from 'class-validator';
import { Size } from '@prisma/client';

export class SubmitIroningDto {
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsEnum(Size)
  size: Size;

  @IsInt()
  @Min(1)
  quantity: number;
}
