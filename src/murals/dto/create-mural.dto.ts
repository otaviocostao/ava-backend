import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MuralTargetRole } from '../entities/mural.entity';

export class CreateMuralDto {
  @ApiProperty({ description: 'Título do mural', example: 'Aviso Importante', maxLength: 255 })
  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MaxLength(255, { message: 'O título deve ter no máximo 255 caracteres.' })
  title: string;

  @ApiPropertyOptional({ description: 'Descrição do mural', example: 'Informações sobre o novo semestre' })
  @IsString({ message: 'A descrição deve ser um texto.' })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Papel de destino do mural', enum: MuralTargetRole, example: MuralTargetRole.ALUNO })
  @IsEnum(MuralTargetRole, { message: 'O papel de destino deve ser "aluno" ou "professor".' })
  @IsNotEmpty({ message: 'O papel de destino é obrigatório.' })
  targetRole: MuralTargetRole;

  @ApiPropertyOptional({ description: 'Ordem de exibição', example: 1, type: Number })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    const num = parseInt(String(value), 10);
    return isNaN(num) ? undefined : num;
  })
  @IsInt({ message: 'A ordem deve ser um número inteiro.' })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Se o mural está ativo', example: true, default: true })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return undefined;
  })
  @IsBoolean({ message: 'O campo isActive deve ser um booleano.' })
  @IsOptional()
  isActive?: boolean;
}

