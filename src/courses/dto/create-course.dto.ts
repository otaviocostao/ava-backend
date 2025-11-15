import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";
import { CourseStatus } from "src/common/enums/course-status.enum";

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome do curso não pode ser vazio.' })  
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'O código do curso não pode ser vazio.' })
    @MaxLength(10, { message: 'O código do curso deve ter no máximo 10 caracteres.' })
    code: string;
        
    @IsUUID('4', { message: 'O ID do departamento deve ser um UUID válido.' })
    @IsNotEmpty({ message: 'O departmentId é obrigatório.' })
    departmentId: string;

    @IsInt({ message: 'A carga horária total deve ser um número inteiro.' })
    @Min(1, { message: 'A carga horária total deve ser maior que zero.' })
    totalHours: number;

    @IsInt({ message: 'A duração em semestres deve ser um número inteiro.' })
    @Min(1, { message: 'A duração em semestres deve ser maior que zero.' })
    durationSemesters: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(CourseStatus, { message: `O status deve ser um dos seguintes valores: ${Object.values(CourseStatus).join(', ')}` })
    @IsOptional()
    status?: CourseStatus;
}
