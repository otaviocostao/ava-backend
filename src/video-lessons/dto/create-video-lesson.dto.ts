import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateVideoLessonDto {
  @IsUUID()
  @IsNotEmpty()
  disciplineId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsUUID()
  @IsOptional()
  uploadedById?: string;
}
