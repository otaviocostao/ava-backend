import { IsEnum, IsOptional } from 'class-validator';
import { CourseDisciplineType } from 'src/common/enums/course-discipline-type.enum';

export class UpdateDisciplineTypeDto {
  @IsEnum(CourseDisciplineType, { message: 'O tipo deve ser "required" ou "optional".' })
  @IsOptional()
  type?: CourseDisciplineType;
}

