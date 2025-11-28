import { IsEnum, IsNotEmpty } from 'class-validator';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { ShiftType } from 'src/common/enums/shift-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ShiftDto {
  @ApiProperty({ description: 'Dia da semana', enum: DayOfWeek })
  @IsEnum(DayOfWeek, {
    message: `dayOfWeek deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}`,
  })
  @IsNotEmpty({ message: 'dayOfWeek é obrigatório.' })
  dayOfWeek: DayOfWeek;

  @ApiProperty({ description: 'Turno', enum: ShiftType })
  @IsEnum(ShiftType, {
    message: `shift deve ser um dos seguintes valores: ${Object.values(ShiftType).join(', ')}`,
  })
  @IsNotEmpty({ message: 'shift é obrigatório.' })
  shift: ShiftType;
}



