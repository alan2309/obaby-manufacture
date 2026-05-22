import { IsString, IsNotEmpty } from 'class-validator';

export class AssignWorkerDto {
  @IsString()
  @IsNotEmpty()
  workerId: string;
}
