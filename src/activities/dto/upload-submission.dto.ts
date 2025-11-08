import { ApiProperty } from '@nestjs/swagger';
import type { MulterFile } from 'src/common/types/multer.types';

export class UploadSubmissionDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Arquivo da submissão da atividade (a atividade será automaticamente marcada como concluída após o upload)',
  })
  file: MulterFile;
}



