import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';

export enum SizeEnum {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
  XXL3 = 'XXL3',
  XXL4 = 'XXL4',
  XXL5 = 'XXL5',
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsEnum(SizeEnum)
  sizeRangeFrom: SizeEnum;

  @IsEnum(SizeEnum)
  sizeRangeTo: SizeEnum;

  @IsArray()
  @IsString({ each: true })
  materialTypeIds: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
