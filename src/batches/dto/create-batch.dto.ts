import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  batchCode: string;
}
