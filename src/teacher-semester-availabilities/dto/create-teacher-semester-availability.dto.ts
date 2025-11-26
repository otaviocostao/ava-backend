import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AvailabilityStatus } from 'src/common/enums/availability-status.enum';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeacherSemesterAvailabilityDto {
  @ApiProperty({ description: 'ID do professor' })
  @IsUUID('4', { message: 'teacherId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'teacherId é obrigatório.' })
  teacherId: string;

  @ApiProperty({ description: 'ID do período acadêmico (semestre)' })
  @IsUUID('4', { message: 'academicPeriodId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'academicPeriodId é obrigatório.' })
  academicPeriodId: string;

  @ApiPropertyOptional({ description: 'Status da disponibilização', enum: AvailabilityStatus, default: AvailabilityStatus.DRAFT })
  @IsEnum(AvailabilityStatus, {
    message: `Status deve ser um dos seguintes valores: ${Object.values(AvailabilityStatus).join(', ')}`,
  })
  @IsOptional()
  status?: AvailabilityStatus;

  @ApiProperty({ description: 'Disponibilidade no turno da manhã' })
  @IsBoolean({ message: 'morning deve ser um valor booleano.' })
  morning: boolean;

  @ApiProperty({ description: 'Disponibilidade no turno da tarde' })
  @IsBoolean({ message: 'afternoon deve ser um valor booleano.' })
  afternoon: boolean;

  @ApiProperty({ description: 'Disponibilidade no turno da noite' })
  @IsBoolean({ message: 'evening deve ser um valor booleano.' })
  evening: boolean;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsString({ message: 'observations deve ser uma string.' })
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional({ description: 'IDs das disciplinas de interesse', type: [String] })
  @IsArray({ message: 'disciplineIds deve ser um array.' })
  @IsUUID('4', { each: true, message: 'Cada disciplineId deve ser um UUID válido.' })
  @IsOptional()
  disciplineIds?: string[];

  @ApiPropertyOptional({ description: 'Dias da semana disponíveis', enum: DayOfWeek, isArray: true })
  @IsArray({ message: 'weekdays deve ser um array.' })
  @IsEnum(DayOfWeek, { each: true, message: `Cada dia da semana deve ser um dos seguintes valores: ${Object.values(DayOfWeek).join(', ')}` })
  @IsOptional()
  weekdays?: DayOfWeek[];
}


