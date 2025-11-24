import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

export class InstallmentResponseDto {
  @ApiProperty({ description: 'ID da parcela' })
  id: string;

  @ApiProperty({ description: 'Mês e ano formatado (ex: "Março 2024")' })
  month: string;

  @ApiProperty({ description: 'Ano' })
  year: number;

  @ApiProperty({ description: 'Valor da parcela' })
  value: number;

  @ApiProperty({ description: 'Data de vencimento (ISO date)' })
  dueDate: string;

  @ApiProperty({ enum: PaymentStatus, description: 'Status da parcela' })
  status: PaymentStatus;

  @ApiProperty({ description: 'Data de pagamento (ISO date)', nullable: true })
  paymentDate: string | null;

  @ApiProperty({ description: 'Desconto aplicado' })
  discount: number;

  @ApiProperty({ description: 'Número da parcela' })
  installmentNumber: number;

  @ApiProperty({ description: 'Total de parcelas' })
  totalInstallments: number;
}

