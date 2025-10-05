import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { CourseStatus } from "src/common/enums/course-status.enum";

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome do curso não pode ser vazio.' })  
    name: string;
        
    @IsUUID('4', { message: 'O ID do departamento deve ser um UUID válido.' })
    @IsOptional()
    departmentId?: string;

    @IsEnum(CourseStatus, { message: `O status deve ser um dos seguintes valores: ${Object.values(CourseStatus).join(', ')}` })
    @IsOptional()
    status?: CourseStatus;
}
