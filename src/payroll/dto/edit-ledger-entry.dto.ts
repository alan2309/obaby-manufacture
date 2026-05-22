import { IsInt, Min } from 'class-validator';

export class EditLedgerEntryDto {
  @IsInt()
  @Min(0)
  quantity: number;
}
