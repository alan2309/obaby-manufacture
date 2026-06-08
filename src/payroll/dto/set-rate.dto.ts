import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, Matches } from 'class-validator';

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
  @Min(0.01, { message: 'Rate must be greater than 0' })
  rate: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Month must be in YYYY-MM format' })
  month: string; // "YYYY-MM"
}
