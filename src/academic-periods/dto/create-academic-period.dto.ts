import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateAcademicPeriodDto {
  @IsString({ message: 'O período letivo deve ser um texto.' })
  @IsNotEmpty({ message: 'O período letivo não pode ser vazio.' })
  @Matches(/^\d{4}\.(1|2)$/, { 
    message: 'O período letivo deve estar no formato YYYY.1 ou YYYY.2 (ex: 2025.1)' 
  })
  period: string;
}

