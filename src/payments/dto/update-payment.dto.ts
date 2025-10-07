import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsDate, IsEnum, IsOptional, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
}
