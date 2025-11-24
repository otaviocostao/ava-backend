import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum ReportType {
  REVENUE = 'revenue',
  EXPENSES = 'expenses',
  DEFAULTING = 'defaulting',
  CASH_FLOW = 'cash_flow',
  COMPLETE = 'complete',
}

export enum ReportPeriod {
  MONTH = 'month',
  QUARTER = 'quarter',
  SEMESTER = 'semester',
  YEAR = 'year',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export class ReportRequestDto {
  @ApiProperty({ enum: ReportType, description: 'Tipo de relatório' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ enum: ReportPeriod, description: 'Período do relatório' })
  @IsEnum(ReportPeriod)
  period: ReportPeriod;

  @ApiProperty({ description: 'Data inicial (ISO date)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data final (ISO date)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ enum: ReportFormat, description: 'Formato do relatório' })
  @IsEnum(ReportFormat)
  format: ReportFormat;
}

export class ReportResponseDto {
  @ApiProperty({ description: 'ID do relatório gerado' })
  reportId: string;

  @ApiProperty({ description: 'URL para download do relatório' })
  downloadUrl: string;

  @ApiProperty({ description: 'Data de expiração da URL (ISO date)' })
  expiresAt: string;
}

