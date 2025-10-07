import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import { NewsTargetType } from '../../common/enums/news-target-type.enum';

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  publishedById: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ValidateIf((dto) => dto.targetId !== undefined)
  @IsEnum(NewsTargetType)
  targetType?: NewsTargetType;

  @ValidateIf((dto) => dto.targetType !== undefined)
  @IsString()
  @IsNotEmpty()
  targetId?: string;
}
