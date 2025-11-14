import { IsString, IsNotEmpty, IsUrl, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateVideoLessonDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsUUID()
  @IsOptional()
  uploadedById?: string;
}
