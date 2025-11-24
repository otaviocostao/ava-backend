import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum FinancialPeriod {
  MONTH = 'month',
  QUARTER = 'quarter',
  SEMESTER = 'semester',
  YEAR = 'year',
}

export class FinancialSummaryQueryDto {
  @ApiProperty({ enum: FinancialPeriod, required: false, description: 'Período para o resumo' })
  @IsOptional()
  @IsEnum(FinancialPeriod)
  period?: FinancialPeriod;

  @ApiProperty({ required: false, description: 'Data inicial (ISO date)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Data final (ISO date)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

