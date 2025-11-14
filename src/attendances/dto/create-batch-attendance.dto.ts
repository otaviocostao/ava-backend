import { IsArray, IsDateString, IsNotEmpty, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class AttendanceItemDto {
  @IsUUID(4, { message: "O ID do Enrollment deve ser um UUID" })
  @IsNotEmpty({ message: 'O ID da matrícula não pode ser vazio.' })
  enrollment_id: string;

  @IsUUID(4, { message: "O ID do Aluno deve ser um UUID" })
  @IsNotEmpty({ message: 'O ID do aluno não pode ser vazio.' })
  student_id: string;

  @IsDateString({}, { message: 'A data deve estar no formato AAAA-MM-DD.' })
  @IsNotEmpty({ message: 'A data não pode ser vazia.' })
  date: string;

  @IsNotEmpty({ message: 'O campo "presente" é obrigatório.' })
  present: boolean;
}

export class CreateBatchAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  attendances: AttendanceItemDto[];
}

