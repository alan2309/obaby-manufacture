import { IsString, IsNotEmpty } from 'class-validator';

export class FinalizePayrollDto {
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @IsString()
  @IsNotEmpty()
  month: string; // "YYYY-MM"
}
