import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

export class FindTeacherAvailabilitiesDto {
  @IsOptional()
  @IsUUID('4', { message: 'academicPeriodId deve ser um UUID valido.' })
  academicPeriodId?: string;

  @IsOptional()
  @IsEnum(DayOfWeek, {
    message: `O dia da semana deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}`,
  })
  dayOfWeek?: DayOfWeek;
}
