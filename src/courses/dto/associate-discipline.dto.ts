import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min, Max } from 'class-validator';

export class AssociateDisciplineDto {
  @IsUUID('4', { message: 'O disciplineId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O disciplineId é obrigatório.' })
  disciplineId: string;

  @IsInt({ message: 'O semestre deve ser um número inteiro.' })
  @Min(1, { message: 'O semestre deve ser maior ou igual a 1.' })
  @Max(20, { message: 'O semestre deve ser menor ou igual a 20.' })
  @IsOptional()
  semester?: number;
}

