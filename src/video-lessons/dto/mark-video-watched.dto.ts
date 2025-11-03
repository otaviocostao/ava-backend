import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class MarkVideoWatchedDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  watchedPercentage?: number;
}

