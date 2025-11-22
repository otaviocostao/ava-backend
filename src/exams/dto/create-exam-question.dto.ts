import {
  IsUUID,
  IsEnum,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsObject,
  IsBoolean,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamQuestionType } from '../../common/enums/exam-question-type.enum';

export class ExamOptionDto {
  @IsString()
  id: string;

  @IsString()
  text: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CreateExamQuestionDto {
  @IsUUID()
  examId: string;

  @IsNumber()
  @Min(1)
  order: number;

  @IsEnum(ExamQuestionType)
  type: ExamQuestionType;

  @IsString()
  questionText: string;

  @IsNumber()
  @Min(0)
  points: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamOptionDto)
  @ArrayMinSize(2, { message: 'Múltipla escolha deve ter pelo menos 2 alternativas' })
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

