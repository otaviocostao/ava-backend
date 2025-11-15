import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AddTeachersDto {
  @ApiProperty({
    description: 'Array de IDs dos usuários (professores) a serem adicionados ao departamento.',
    example: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1ffcd22-0d1c-5fg9-cc7e-7cc0ce491b22'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'É necessário informar pelo menos um professor.' })
  @IsUUID('4', { each: true, message: 'Todos os IDs devem ser UUIDs válidos.' })
  userIds: string[];
}

