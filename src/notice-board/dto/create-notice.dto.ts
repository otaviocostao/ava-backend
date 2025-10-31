import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDateString } from 'class-validator';
import { NoticeAudience } from 'src/common/enums/notice-audience.enum';

export class CreateNoticeDto {
  @IsString({ message: 'O titulo deve ser um texto.' })
  @MaxLength(120, { message: 'O titulo deve ter no maximo 120 caracteres.' })
  title: string;

  @IsString({ message: 'O conteudo deve ser um texto.' })
  @MaxLength(2000, { message: 'O conteudo deve ter no maximo 2000 caracteres.' })
  content: string;

  @IsEnum(NoticeAudience, {
    message: `O publico deve ser um dos seguintes valores: ${Object.values(NoticeAudience).join(', ')}`,
  })
  audience: NoticeAudience;

  @IsOptional()
  @IsDateString({}, { message: 'A data de expiracao deve estar no formato ISO.' })
  expiresAt?: string;
}
