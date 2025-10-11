import { IsDateString, IsEnum, IsString, IsUUID } from "class-validator";
import { DayOfWeek } from "src/common/enums/day-of-week.enum";

export class CreateAvailabilityDto {
    
    @IsUUID(4, { message: 'O ID da turma deve ser um UUID válido.' })
    teacherId: string;

    @IsString({message: 'O semestre deve ser uma string'})
    semester: string;

    @IsEnum(DayOfWeek, { message: `O dia da semana deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}` })
    dayOfWeek: DayOfWeek;

    @IsDateString()
    startTime: string;
    
    @IsDateString()
    endTime: string;
}
