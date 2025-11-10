import { ArrayNotEmpty, ArrayUnique, IsArray, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateDisciplineDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da disciplina não pode ser vazio.' })
  name: string;

  @IsArray({ message: 'courseIds deve ser um array de UUIDs.' })
  @ArrayNotEmpty({ message: 'É obrigatório informar ao menos um curso.' })
  @ArrayUnique({ message: 'courseIds contém valores duplicados.' })
  @IsUUID('4', { each: true, message: 'Cada courseId deve ser um UUID válido.' })
  courseIds: string[];

  @IsNumber()
  credits: number;

  @IsNumber()
  @IsNotEmpty({message: 'O campo workload deve receber um valor int para informar a carga horária da disciplina'})
  workload: number;
}
