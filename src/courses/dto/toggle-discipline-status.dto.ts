import { IsEnum, IsNotEmpty } from 'class-validator';
import { CourseDisciplineStatus } from 'src/common/enums/course-discipline-status.enum';

export class ToggleDisciplineStatusDto {
  @IsEnum(CourseDisciplineStatus, {
    message: `O status deve ser um dos seguintes valores: ${Object.values(CourseDisciplineStatus).join(', ')}`,
  })
  @IsNotEmpty({ message: 'O status é obrigatório.' })
  status: CourseDisciplineStatus;
}

