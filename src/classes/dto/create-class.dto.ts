import { IsNotEmpty, IsInt, IsOptional, IsString, IsUUID, IsEnum, IsMilitaryTime, MaxLength, ValidateIf } from "class-validator";
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

export class CreateClassDto {
    @IsString()
    @IsNotEmpty({message: "O código da turma não pode ser vazio"})
    code: string;

    @IsUUID('4', { message: 'O ID do período letivo deve ser um UUID válido.' })
    @IsNotEmpty({ message: 'O período letivo é obrigatório.' })
    academicPeriodId: string;

    @IsInt()
    @IsNotEmpty()
    year: number;

    @IsUUID('4', { message: 'O ID da Disciplina deve ser um UUID válido.' })
    @IsNotEmpty()
    disciplineId: string;

    @IsUUID('4', { message: 'O ID do Docente deve ser um UUID válido.' })
    @IsOptional()
    teacherId?: string;

    // Campos opcionais para criação automática de schedule e lesson plans
    @IsEnum(DayOfWeek, {
        message: `O dia da semana deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}`,
    })
    @IsOptional()
    dayOfWeek?: DayOfWeek;

    @ValidateIf((o) => o.dayOfWeek)
    @IsMilitaryTime({ message: 'O horário de início deve estar no formato HH:mm.' })
    @IsOptional()
    startTime?: string;

    @ValidateIf((o) => o.dayOfWeek)
    @IsMilitaryTime({ message: 'O horário de término deve estar no formato HH:mm.' })
    @IsOptional()
    endTime?: string;

    @IsOptional()
    @IsString({ message: 'A sala deve ser um texto.' })
    @MaxLength(50, { message: 'A sala deve ter no máximo 50 caracteres.' })
    room?: string;
}
