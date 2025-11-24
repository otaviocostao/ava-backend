import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class PaymentResponseDto {
  @ApiProperty({ description: 'ID do pagamento' })
  id: string;

  @ApiProperty({ description: 'Descrição do pagamento' })
  description: string;

  @ApiProperty({ description: 'Valor do pagamento' })
  value: number;

  @ApiProperty({ description: 'Data de pagamento (ISO date)' })
  paymentDate: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Método de pagamento', nullable: true })
  method: PaymentMethod | null;

  @ApiProperty({ enum: PaymentStatus, description: 'Status do pagamento' })
  status: PaymentStatus;

  @ApiProperty({ description: 'URL do comprovante', nullable: true })
  receiptUrl: string | null;

  @ApiProperty({ description: 'ID da parcela relacionada', nullable: true })
  installmentId: string | null;
}

