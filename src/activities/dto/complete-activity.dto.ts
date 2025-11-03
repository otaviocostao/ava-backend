import { IsEnum, IsOptional } from 'class-validator';
import { ActivitySubmissionStatus } from '../../common/enums/activity-submission-status.enum';

export class CompleteActivityDto {
  @IsEnum(ActivitySubmissionStatus)
  @IsOptional()
  status?: ActivitySubmissionStatus;
}

