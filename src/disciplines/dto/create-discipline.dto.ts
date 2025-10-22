import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDisciplineDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da disciplina não pode ser vazio.' })
  name: string;

  @IsOptional()
  @IsUUID('4', { message: 'O ID do curso deve ser um UUID válido.' })
  courseId?: string | null;

  @IsNumber()
  credits: number;
}
