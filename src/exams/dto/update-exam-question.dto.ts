import {
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
  IsArray,
  IsObject,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamQuestionType } from '../../common/enums/exam-question-type.enum';
import { ExamOptionDto } from './create-exam-question.dto';

export class UpdateExamQuestionDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsEnum(ExamQuestionType)
  type?: ExamQuestionType;

  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamOptionDto)
  @ArrayMinSize(2)
  options?: ExamOptionDto[] | null;

  @IsOptional()
  @IsObject()
  correctAnswer?: any | null;

  @IsOptional()
  @IsObject()
  rubric?: Record<string, any> | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any> | null;
}

