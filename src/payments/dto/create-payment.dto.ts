import { IsNumber, IsDate, IsEnum, IsOptional, IsDecimal, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class CreatePaymentDto {
  @IsUUID(4, {message: "O ID do estudante deve ser um UUID válido"})
  studentId: string;

  @IsDecimal({ decimal_digits: '2' })
  amount: number;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paidAt?: Date;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
