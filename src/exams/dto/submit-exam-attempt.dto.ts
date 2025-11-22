import { IsUUID, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { SaveExamAnswerDto } from './save-exam-answer.dto';

export class SubmitExamAttemptDto {
  @IsUUID()
  attemptId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveExamAnswerDto)
  answers?: SaveExamAnswerDto[];
}

