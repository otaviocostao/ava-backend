import { IsDateString, IsEnum, IsUUID } from "class-validator";
import { DayOfWeek } from "src/common/enums/day-of-week.enum";

export class CreateScheduleDto {
    @IsUUID(4, {message: 'classId deve ser um UUID válido.'})
    classId: string;
    
    @IsEnum(DayOfWeek, { message: `O dia da semana deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}` })
    dayOfWeek: DayOfWeek;

    @IsDateString()
    startTime: string;
    
    @IsDateString()
    endTime: string;
    
    @IsDateString()
    room?: string;
}
