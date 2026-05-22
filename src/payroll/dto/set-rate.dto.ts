import { IsString, IsNotEmpty, IsNumber, Min, IsEnum } from 'class-validator';

enum StageEnum {
  CUTTING = 'CUTTING',
  STITCHING = 'STITCHING',
  IRONING = 'IRONING',
}

export class SetRateDto {
  @IsString()
  @IsNotEmpty()
  materialTypeId: string;

  @IsEnum(StageEnum)
  stage: string;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsString()
  @IsNotEmpty()
  month: string; // "YYYY-MM"
}
