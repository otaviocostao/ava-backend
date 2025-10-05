import { IsNotEmpty, IsString } from "class-validator";

export class CreateRoleDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome da Role não pode ser vazio.' })
    name: string;
}
