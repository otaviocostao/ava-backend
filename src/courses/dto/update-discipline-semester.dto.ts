import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateDisciplineSemesterDto {
  @IsInt({ message: 'O semestre deve ser um número inteiro.' })
  @Min(1, { message: 'O semestre deve ser maior ou igual a 1.' })
  @Max(20, { message: 'O semestre deve ser menor ou igual a 20.' })
  @IsOptional()
  semester?: number;
}

