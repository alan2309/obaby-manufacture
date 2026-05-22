import { IsNumber, Min } from 'class-validator';

export class SetThresholdDto {
  @IsNumber()
  @Min(0)
  value: number;
}
