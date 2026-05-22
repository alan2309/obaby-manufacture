import { IsString, IsNotEmpty } from 'class-validator';

export class AssignRollDto {
  @IsString()
  @IsNotEmpty()
  rollId: string;
}
