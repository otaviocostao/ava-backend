import { IsUUID } from 'class-validator';

export class AssignTeacherDto {
  @IsUUID('4', { message: 'O ID do docente deve ser um UUID válido.' })
  teacherId: string;
}
