import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class UpdateRollDto {
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  shade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gsm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingMeters?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;
}
