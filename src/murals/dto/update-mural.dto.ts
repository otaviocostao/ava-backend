import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { MuralTargetRole } from '../entities/mural.entity';

export class UpdateMuralDto {
  @IsString({ message: 'O título deve ser um texto.' })
  @MaxLength(255, { message: 'O título deve ter no máximo 255 caracteres.' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'A descrição deve ser um texto.' })
  @IsOptional()
  description?: string;

  @IsEnum(MuralTargetRole, { message: 'O papel de destino deve ser "aluno" ou "professor".' })
  @IsOptional()
  targetRole?: MuralTargetRole;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    const num = parseInt(String(value), 10);
    return isNaN(num) ? undefined : num;
  })
  @IsInt({ message: 'A ordem deve ser um número inteiro.' })
  @IsOptional()
  order?: number;

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

