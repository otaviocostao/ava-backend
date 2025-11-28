import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AvailabilityStatus } from 'src/common/enums/availability-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftDto } from './shift-dto';

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

  @ApiProperty({ description: 'Turnos disponíveis por dia da semana', type: [ShiftDto] })
  @IsArray({ message: 'shifts deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  @IsNotEmpty({ message: 'Pelo menos um turno deve ser selecionado.' })
  shifts: ShiftDto[];

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsString({ message: 'observations deve ser uma string.' })
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional({ description: 'IDs das disciplinas de interesse', type: [String] })
  @IsArray({ message: 'disciplineIds deve ser um array.' })
  @IsUUID('4', { each: true, message: 'Cada disciplineId deve ser um UUID válido.' })
  @IsOptional()
  disciplineIds?: string[];
}


