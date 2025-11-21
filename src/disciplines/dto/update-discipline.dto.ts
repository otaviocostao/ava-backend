import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDisciplineDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  credits?: number;

  @IsNumber()
  @IsOptional()
  workload?: number;
}
