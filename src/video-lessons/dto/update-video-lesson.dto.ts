import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVideoLessonDto {
  @ApiPropertyOptional({
    description: 'Título da video-aula',
    example: 'Aula 03 — Introdução a Grafos (Atualizada)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Descrição da video-aula',
    example: 'Conteúdo atualizado sobre estruturas de dados',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Visibilidade da video-aula',
    enum: ['class', 'private', 'public'],
    example: 'class',
  })
  @IsString()
  @IsOptional()
  visibility?: string; // class | private | public

  @ApiPropertyOptional({
    description: 'Duração do vídeo em segundos',
    example: 3600,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  durationSeconds?: number;
}
