import { IsEnum, IsMilitaryTime, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

export class CreateScheduleDto {
  @IsUUID('4', { message: 'classId deve ser um UUID valido.' })
  classId: string;

  @IsEnum(DayOfWeek, {
    message: `O dia da semana deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}`,
  })
  dayOfWeek: DayOfWeek;

  @IsMilitaryTime({ message: 'O horario de inicio deve estar no formato HH:mm.' })
  startTime: string;

  @IsMilitaryTime({ message: 'O horario de termino deve estar no formato HH:mm.' })
  endTime: string;

  @IsOptional()
  @IsString({ message: 'A sala deve ser um texto.' })
  @MaxLength(50, { message: 'A sala deve ter no maximo 50 caracteres.' })
  room?: string;
}
