import { IsNumber, IsDate, IsEnum, IsOptional, IsDecimal, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class CreatePaymentDto {
  @IsString()
  student_id: string;

  @IsDecimal({ decimal_digits: '2' })
  amount: number;

  @IsDate()
  @Type(() => Date)
  due_date: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paid_at?: Date;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}
