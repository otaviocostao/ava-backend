import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID('4', { message: 'O ID do estudante deve ser um UUID valido.' })
  studentId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O valor deve ter no maximo duas casas decimais.' })
  @IsPositive({ message: 'O valor deve ser positivo.' })
  amount: number;

  @IsDateString({}, { message: 'A data de vencimento deve estar no formato YYYY-MM-DD.' })
  dueDate: string;
}
