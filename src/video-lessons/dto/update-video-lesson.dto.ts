import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoLessonDto } from './create-video-lesson.dto';

export class UpdateVideoLessonDto extends PartialType(CreateVideoLessonDto) {}
