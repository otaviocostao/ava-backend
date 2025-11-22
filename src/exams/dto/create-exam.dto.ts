import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  IsObject,
  Min,
} from 'class-validator';

export class CreateExamDto {
  @IsUUID()
  activityId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimitMinutes?: number | null;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @IsOptional()
  @IsBoolean()
  autoGrade?: boolean;

  @IsOptional()
  @IsString()
  instructions?: string | null;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any> | null;
}

