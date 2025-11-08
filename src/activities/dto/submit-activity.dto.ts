import { IsOptional, IsString, IsUUID, IsArray } from 'class-validator';

export class SubmitActivityDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileUrls?: string[];
}

