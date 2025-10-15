import {IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateForumPostDto {
    @IsUUID('4', { message: 'O ID do fórum deve ser um UUID válido.' })
    @IsNotEmpty({ message: 'O ID do fórum é obrigatório.' })
    forumId: string;
    
    @IsUUID('4', { message: 'O ID do usuário deve ser um UUID válido.' })
    @IsNotEmpty({ message: 'O ID do usuário é obrigatório.' })
    userId: string;

    @IsString()
    @IsNotEmpty({ message: 'O conteúdo do post não pode ser vazio.' })
    @MaxLength(5000, { message: 'O conteúdo não pode exceder 5000 caracteres.' })
    content: string;

    @IsUUID('4', { message: 'O ID do post pai deve ser um UUID válido.' })
    @IsOptional()
    parentPostId?: string;
}
