import { IsString, IsNotEmpty, IsUrl, IsNumber, IsUUID } from 'class-validator';

export class CreateVideoLessonDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl()
  @IsNotEmpty()
  videoUrl: string;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsUUID()
  @IsNotEmpty()
  uploadedById: string;
}
