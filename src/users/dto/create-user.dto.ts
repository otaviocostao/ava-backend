import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from "class-validator";

export class CreateUserDto {    
    @IsString()
    @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
    name: string;
        
    @IsEmail()
    @IsNotEmpty({ message: 'O e-mail não pode ser vazio.' })
    email: string;
    
    @IsStrongPassword()
    @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
    password: string;
}
