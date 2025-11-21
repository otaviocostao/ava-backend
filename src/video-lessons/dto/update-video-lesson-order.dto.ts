import { IsArray, ValidateNested, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VideoLessonOrderItem {
  @ApiProperty({
    description: 'ID da video-aula',
    example: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Nova ordem da video-aula (deve ser um número positivo)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  order: number;
}

export class UpdateVideoLessonOrderDto {
  @ApiProperty({
    description: 'Array de video-aulas com suas novas ordens',
    type: [VideoLessonOrderItem],
    example: [
      { id: 'a0b12c3d-4e5f-6789-0123-456789abcdef', order: 1 },
      { id: 'b1c23d4e-5f67-8901-2345-6789bcdef012', order: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoLessonOrderItem)
  updates: VideoLessonOrderItem[];
}

