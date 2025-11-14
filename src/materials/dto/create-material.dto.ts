import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateMaterialDto {
    
    @ApiProperty({
        description: 'ID da turma à qual o material pertence',
        format: 'uuid',
        example: '5a2b1f6e-5b9a-4ed5-8aa9-3c8e9c9a1a10'
    })
    @IsUUID(4, { message: 'O ID da turma deve ser um UUID válido.' })
    classId: string;

    @ApiProperty({
        description: 'Título do material',
        example: 'Slides - Introdução à Programação'
    })
    @IsString({ message: 'O título do material deve ser uma string.' })
    title: string;

    @ApiPropertyOptional({
        description: 'Lista de URLs públicas dos anexos do material (preenchida automaticamente após upload)',
        type: [String],
        example: []
    })
    @IsOptional()
    @IsArray({ message: 'As URLs dos arquivos devem ser um array de strings.' })
    fileUrl?: string[];

    @ApiPropertyOptional({
        description: 'Descrição textual do material',
        example: 'Apresentação sobre conceitos básicos de programação.'
    })
    @IsOptional()
    @IsString({ message: 'A descrição do material deve ser uma string.' })
    description?: string;
    
    @ApiProperty({
        description: 'ID do professor que publicou o material',
        format: 'uuid',
        example: 'c2e7e4a0-8a4a-4df1-9f3c-1b4d2f5e7a90'
    })
    @IsUUID(4, { message: 'O ID do usuário que enviou o material deve ser um UUID válido.' })
    uploadedById: string;

}
