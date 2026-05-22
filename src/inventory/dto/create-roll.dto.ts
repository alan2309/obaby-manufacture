import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateRollDto {
  @IsNotEmpty()
  @IsString()
  rollCode: string;

  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @IsNotEmpty()
  @IsString()
  materialTypeId: string;

  @IsNotEmpty()
  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  shade?: string;

  @IsNumber()
  @Min(0)
  gsm: number;

  @IsNumber()
  @Min(0)
  initialMeters: number;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsDateString()
  purchaseDate: string;
}
