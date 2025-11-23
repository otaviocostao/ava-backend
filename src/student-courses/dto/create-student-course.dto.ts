import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { StudentCourseStatus } from "src/common/enums/student-course-status.enum";

export class CreateStudentCourseDto {
  @IsUUID('4')
  @IsNotEmpty()
  studentId: string;

  @IsUUID('4')
  @IsNotEmpty()
  courseId: string;

  @IsUUID('4', { message: 'O ID do período letivo de entrada deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O período letivo de entrada é obrigatório.' })
  entryAcademicPeriodId: string;

  @IsEnum(StudentCourseStatus)
  @IsOptional()
  status?: StudentCourseStatus;
}


