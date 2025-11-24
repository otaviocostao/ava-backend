import { IsDateString, IsNotEmpty, IsString, Matches, ValidateIf } from 'class-validator';

export class CreateAcademicPeriodDto {
  @IsString({ message: 'O período letivo deve ser um texto.' })
  @IsNotEmpty({ message: 'O período letivo não pode ser vazio.' })
  @Matches(/^\d{4}\.(1|2)$/, { 
    message: 'O período letivo deve estar no formato YYYY.1 ou YYYY.2 (ex: 2025.1)' 
  })
  period: string;

  @IsDateString({}, { message: 'A data de início deve ser uma data válida no formato ISO (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'A data de início é obrigatória.' })
  startDate: string;

  @IsDateString({}, { message: 'A data de fim deve ser uma data válida no formato ISO (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'A data de fim é obrigatória.' })
  endDate: string;
}


