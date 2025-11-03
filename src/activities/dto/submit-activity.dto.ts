import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SubmitActivityDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}

