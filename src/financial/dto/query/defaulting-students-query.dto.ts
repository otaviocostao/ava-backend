import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DefaultingStudentsQueryDto {
  @ApiProperty({ required: false, description: 'Busca por nome ou email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'ID da turma para filtrar' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({ required: false, description: 'Mínimo de meses em atraso' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minMonths?: number;

  @ApiProperty({ required: false, description: 'Máximo de meses em atraso' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMonths?: number;
}

