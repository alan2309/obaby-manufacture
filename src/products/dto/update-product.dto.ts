import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { SizeEnum } from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(SizeEnum)
  sizeRangeFrom?: SizeEnum;

  @IsOptional()
  @IsEnum(SizeEnum)
  sizeRangeTo?: SizeEnum;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialTypeIds?: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
