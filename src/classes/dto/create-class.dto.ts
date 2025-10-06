import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateClassDto {
    @IsString()
    @IsNotEmpty({message: "O código da turma não pode ser vazio"})
    code: string;

    @IsString()
    semester: string;

    @IsNotEmpty()
    year: number;

    @IsUUID('4', { message: 'O ID da Disciplina deve ser um UUID válido.' })
    @IsNotEmpty()
    disciplineId: string;

    @IsUUID('4', { message: 'O ID do Docente deve ser um UUID válido.' })
    @IsOptional()
    teacherId?: string;
}
