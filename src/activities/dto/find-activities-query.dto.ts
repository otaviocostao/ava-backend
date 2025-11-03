import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ActivitySubmissionStatus } from '../../common/enums/activity-submission-status.enum';

export class FindActivitiesQueryDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsEnum(ActivitySubmissionStatus)
  @IsOptional()
  status?: ActivitySubmissionStatus;
}

