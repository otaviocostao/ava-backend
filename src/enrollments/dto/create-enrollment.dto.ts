import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateEnrollmentDto {

  @IsUUID('4', { message: 'O ID do aluno deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do aluno não pode ser vazio.' })
  studentId: string;

  @IsUUID('4', { message: 'O ID da turma deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID da turma não pode ser vazio.' })
  classId: string;
}
