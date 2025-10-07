import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateGradeDto {
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @IsUUID()
  @IsNotEmpty()
  activityId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  score: number;

  @IsOptional()
  @IsDateString()
  gradedAt?: string;
}
