import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateDepartmentDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome do Departamento não pode ser vazio.' })  
    name: string;
    
    @IsUUID('4', { message: 'O ID do coordenador deve ser um UUID válido.' })
    @IsOptional()
    coordinatorId?: string;
}
