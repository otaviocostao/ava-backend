import { OmitType } from '@nestjs/swagger';
import { CreateGradeDto } from './create-grade.dto';

export class CreateActivityGradeDto extends OmitType(CreateGradeDto, [
  'activityId',
] as const) {}

