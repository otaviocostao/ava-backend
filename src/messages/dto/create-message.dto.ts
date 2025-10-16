import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from "class-validator";

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty({ message: 'O conteúdo da mensagem não pode ser vazio.' })
    @MaxLength(2000, { message: 'A mensagem não pode exceder 2000 caracteres.' })
    content: string;
    
    @IsUUID('4', { message: 'O ID do destinatário deve ser um UUID válido.' })
    @IsOptional()
    @ValidateIf((o) => !o.classId)
    @IsNotEmpty({ message: 'É necessário fornecer um destinatário (receiverId) ou uma turma (classId).' })
    receiverId?: string;
    
    @IsUUID('4', { message: 'O ID da turma deve ser um UUID válido.' })
    @IsOptional()
    classId?: string;
}
