import { IsString, IsNotEmpty, IsInt, Min, IsEnum } from 'class-validator';

enum StageEnum {
  CUTTING = 'CUTTING',
  STITCHING = 'STITCHING',
  IRONING = 'IRONING',
}

export class CreateLedgerEntryDto {
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @IsString()
  @IsNotEmpty()
  batchId: string;

  @IsString()
  @IsNotEmpty()
  materialTypeId: string;

  @IsEnum(StageEnum)
  stage: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
