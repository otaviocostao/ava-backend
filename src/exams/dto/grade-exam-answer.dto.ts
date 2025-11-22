import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GradeExamAnswerDto {
  @IsUUID()
  answerId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pointsEarned?: number | null;

  @IsOptional()
  @IsString()
  feedback?: string | null;
}

