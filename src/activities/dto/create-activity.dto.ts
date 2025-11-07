import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { ActivityType } from '../../common/enums/activity-type.enum';

export class CreateActivityDto {
  @IsUUID()
  classId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @IsOptional()
  @IsNumber()
  maxScore?: number;
}
