import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVideoLessonUploadDto {
  @ApiProperty({
    description: 'Título da video-aula',
    example: 'Aula 03 — Introdução a Grafos',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Descrição da video-aula',
    example: 'Conteúdo da semana 3 sobre estruturas de dados',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Extensão do arquivo de vídeo (sem o ponto)',
    example: 'mp4',
    pattern: '^[a-zA-Z0-9]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'fileExtension deve conter apenas letras e números' })
  fileExtension: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo de vídeo',
    example: 'video/mp4',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 104857600,
    minimum: 1,
    maximum: 10737418240, // 10GB
  })
  @IsNumber()
  @Min(1)
  @Max(10 * 1024 * 1024 * 1024) // 10GB máximo
  sizeBytes: number;
}

