import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLiveSessionDto {
  @IsUUID('4')
  classId: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingUrl?: string;
}


