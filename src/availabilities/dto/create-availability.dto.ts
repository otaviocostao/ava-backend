import { IsEnum, IsMilitaryTime, IsString, IsUUID, MaxLength } from 'class-validator';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

export class CreateAvailabilityDto {
  @IsUUID('4', { message: 'teacherId deve ser um UUID valido.' })
  teacherId: string;

  @IsString({ message: 'O semestre deve ser um texto.' })
  @MaxLength(50, { message: 'O semestre deve ter no maximo 50 caracteres.' })
  semester: string;

  @IsEnum(DayOfWeek, {
    message: `O dia da semana deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}`,
  })
  dayOfWeek: DayOfWeek;

  @IsMilitaryTime({ message: 'O horario de inicio deve estar no formato HH:mm.' })
  startTime: string;

  @IsMilitaryTime({ message: 'O horario de termino deve estar no formato HH:mm.' })
  endTime: string;
}
