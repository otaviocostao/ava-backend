import { IsBoolean, IsOptional } from 'class-validator';

export class MarkMessageReadDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

