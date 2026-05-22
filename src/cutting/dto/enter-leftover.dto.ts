import { IsNumber, Min } from 'class-validator';

export class EnterLeftoverDto {
  @IsNumber()
  @Min(0)
  leftoverMeters: number;
}
