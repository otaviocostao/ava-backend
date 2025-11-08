import { ApiProperty } from '@nestjs/swagger';
import type { MulterFile } from 'src/common/types/multer.types';

export class UploadAttachmentDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Arquivos a serem enviados como anexos da atividade (múltiplos arquivos permitidos)',
  })
  files: MulterFile[];
}



