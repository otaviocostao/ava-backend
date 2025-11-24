import { IsDateString, IsOptional, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateAcademicPeriodDto } from './create-academic-period.dto';

export class UpdateAcademicPeriodDto extends PartialType(CreateAcademicPeriodDto) {
  @ValidateIf((o) => o.startDate !== undefined)
  @IsDateString({}, { message: 'A data de início deve ser uma data válida no formato ISO (YYYY-MM-DD).' })
  startDate?: string;

  @ValidateIf((o) => o.endDate !== undefined)
  @IsDateString({}, { message: 'A data de fim deve ser uma data válida no formato ISO (YYYY-MM-DD).' })
  endDate?: string;
}


