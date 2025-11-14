import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateLessonPlanDto {
    @IsUUID(4, {message: 'O ID da classe deve ser um UUID válido.'})
    @IsNotEmpty({message: 'O ID da classe não deve estar vazio'})
    classId: string;

    @IsUUID(4, {message: 'O ID do schedule deve ser um UUID válido.'})
    @IsOptional()
    scheduleId?: string;

    @IsDateString({}, { message: 'A data deve estar no formato AAAA-MM-DD.' })
    @IsNotEmpty({ message: 'A data não pode ser vazia.' })
    date: string;

    @IsEnum(['agendada', 'realizada', 'cancelada'], { message: 'O status deve ser: agendada, realizada ou cancelada.' })
    @IsOptional()
    status?: 'agendada' | 'realizada' | 'cancelada';

    @IsString({message: 'O conteúdo do plano de aula não deve estar vazio'})
    content: string;
}
