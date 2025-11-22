import { IsUUID } from 'class-validator';

export class StartExamAttemptDto {
  @IsUUID()
  examId: string;
}

