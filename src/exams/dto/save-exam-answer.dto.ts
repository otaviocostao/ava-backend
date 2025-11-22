import { IsUUID, IsObject, IsOptional } from 'class-validator';

export class SaveExamAnswerDto {
  @IsUUID()
  questionId: string;

  @IsObject()
  answerData: { selected_option_id?: string; text?: string };
}

