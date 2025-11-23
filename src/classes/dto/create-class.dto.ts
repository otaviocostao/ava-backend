import { IsNotEmpty, IsInt, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateClassDto {
    @IsString()
    @IsNotEmpty({message: "O código da turma não pode ser vazio"})
    code: string;

    @IsUUID('4', { message: 'O ID do período letivo deve ser um UUID válido.' })
    @IsNotEmpty({ message: 'O período letivo é obrigatório.' })
    academicPeriodId: string;

    @IsInt()
    @IsNotEmpty()
    year: number;

    @IsUUID('4', { message: 'O ID da Disciplina deve ser um UUID válido.' })
    @IsNotEmpty()
    disciplineId: string;

    @IsUUID('4', { message: 'O ID do Docente deve ser um UUID válido.' })
    @IsOptional()
    teacherId?: string;
}
