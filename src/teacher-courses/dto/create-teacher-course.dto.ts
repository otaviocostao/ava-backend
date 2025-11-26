import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeacherCourseDto {
  @ApiProperty({ description: 'ID do professor' })
  @IsUUID('4', { message: 'teacherId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'teacherId é obrigatório.' })
  teacherId: string;

  @ApiProperty({ description: 'ID do curso' })
  @IsUUID('4', { message: 'courseId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'courseId é obrigatório.' })
  courseId: string;
}

