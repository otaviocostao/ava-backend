import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { CourseDisciplineType } from 'src/common/enums/course-discipline-type.enum';

export class AssociateDisciplineDto {
  @IsUUID('4', { message: 'O disciplineId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O disciplineId é obrigatório.' })
  disciplineId: string;

  @IsInt({ message: 'O semestre deve ser um número inteiro.' })
  @Min(1, { message: 'O semestre deve ser maior ou igual a 1.' })
  @Max(20, { message: 'O semestre deve ser menor ou igual a 20.' })
  @IsOptional()
  semester?: number;

  @IsEnum(CourseDisciplineType, { message: 'O tipo deve ser "required" ou "optional".' })
  @IsOptional()
  type?: CourseDisciplineType;
}

