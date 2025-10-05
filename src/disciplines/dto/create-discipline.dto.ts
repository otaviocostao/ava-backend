import { IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

export class CreateDisciplineDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome da Disciplina não pode ser vazio.' })
    name: string;

    @IsUUID('4', { message: 'O ID da Disciplina deve ser um UUID válido.' })
    courseId?: string;

    @IsNumber()
    credits: number;
}
