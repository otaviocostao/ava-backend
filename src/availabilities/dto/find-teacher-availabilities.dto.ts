import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

export class FindTeacherAvailabilitiesDto {
  @IsOptional()
  @IsString({ message: 'O semestre deve ser um texto.' })
  @MaxLength(50, { message: 'O semestre deve ter no maximo 50 caracteres.' })
  semester?: string;

  @IsOptional()
  @IsEnum(DayOfWeek, {
    message: `O dia da semana deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}`,
  })
  dayOfWeek?: DayOfWeek;
}
