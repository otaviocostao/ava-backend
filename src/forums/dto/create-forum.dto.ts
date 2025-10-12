import { IsString, IsUUID } from "class-validator";

export class CreateForumDto {
    @IsUUID(4, { message: 'O ID da turma deve ser um UUID válido.' })
    classId: string;

    @IsString({ message: 'O título deve ser uma string.' })
    title: string;

    @IsString({ message: 'A descrição deve ser uma string.' })
    description?: string;
}
