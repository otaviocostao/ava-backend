import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, Matches, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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

  @ApiPropertyOptional({
    description: 'Extensão do arquivo de vídeo (sem o ponto). Opcional se o arquivo for enviado via multipart.',
    example: 'mp4',
    pattern: '^[a-zA-Z0-9]+$',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @ValidateIf((o) => o.fileExtension !== undefined && o.fileExtension !== null)
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'fileExtension deve conter apenas letras e números' })
  fileExtension?: string;

  @ApiPropertyOptional({
    description: 'Tipo MIME do arquivo de vídeo. Opcional se o arquivo for enviado via multipart.',
    example: 'video/mp4',
  })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Tamanho do arquivo em bytes. Opcional se o arquivo for enviado via multipart.',
    example: 104857600,
    minimum: 1,
    maximum: 10737418240, // 10GB
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @ValidateIf((o) => o.sizeBytes !== undefined && o.sizeBytes !== null)
  @IsNumber({}, { message: 'sizeBytes deve ser um número' })
  @Min(1)
  @Max(10 * 1024 * 1024 * 1024) // 10GB máximo
  sizeBytes?: number;

  @ApiPropertyOptional({
    description: 'Ordem da video-aula na disciplina (opcional, será calculada automaticamente se não fornecido)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @ValidateIf((o) => o.order !== undefined && o.order !== null)
  @IsNumber({}, { message: 'order deve ser um número' })
  @Min(1)
  order?: number;
}

