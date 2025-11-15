import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from "class-validator";
import { StudentCourseStatus } from "src/common/enums/student-course-status.enum";

export class CreateStudentCourseDto {
  @IsUUID('4')
  @IsNotEmpty()
  studentId: string;

  @IsUUID('4')
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(1|2)$/, { message: 'entrySemester deve estar no formato YYYY-1|2' })
  entrySemester: string;

  @IsEnum(StudentCourseStatus)
  @IsOptional()
  status?: StudentCourseStatus;
}


