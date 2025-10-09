import { IsString, IsUUID } from "class-validator";

export class CreateMaterialDto {
    
    @IsUUID(4, { message: 'O ID da turma deve ser um UUID válido.' })
    classId: string;

    @IsString({ message: 'O título do material deve ser uma string.' })
    title: string;

    @IsString({ message: 'A URL do arquivo deve ser uma string.' })
    fileUrl?: string

    @IsString({ message: 'A descrição do material deve ser uma string.' })
    description?: string;
    
    @IsUUID(4, { message: 'O ID do usuário que enviou o material deve ser um UUID válido.' })
    uploadedById: string;

}
