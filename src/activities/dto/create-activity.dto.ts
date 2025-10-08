import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { ActivityType } from '../../common/enums/activity-type.enum';

export class CreateActivityDto {
  @IsUUID()
  class_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsOptional()
  @IsDateString()
  due_date?: Date;

  @IsOptional()
  @IsNumber()
  max_score?: number;
}
