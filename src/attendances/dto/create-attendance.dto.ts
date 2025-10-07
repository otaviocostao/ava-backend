import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class CreateAttendanceDto {
    @IsUUID(4, {message: "O Id do Enrollment deve ser um UUID"})
    @IsNotEmpty({ message: 'O ID da matrícula não pode ser vazio.' })
    enrollment_id: string;

    @IsDateString({}, { message: 'A data deve estar no formato AAAA-MM-DD.' })
    @IsNotEmpty({ message: 'A data não pode ser vazia.' })
    date: string;

    @IsBoolean({ message: 'O campo "presente" deve ser um valor booleano (true ou false).' })
    @IsOptional()
    present?: boolean;
}
