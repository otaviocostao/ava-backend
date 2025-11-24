import { ApiProperty } from '@nestjs/swagger';

export class FinancialSummaryResponseDto {
  @ApiProperty({ description: 'Total anual de mensalidades' })
  totalAnnual: number;

  @ApiProperty({ description: 'Total pago' })
  totalPaid: number;

  @ApiProperty({ description: 'Total pendente' })
  totalPending: number;

  @ApiProperty({ description: 'Próxima data de vencimento (ISO date)', nullable: true })
  nextDueDate: string | null;

  @ApiProperty({ description: 'Descontos acumulados' })
  accumulatedDiscount: number;

  @ApiProperty({ description: 'Total de parcelas' })
  totalInstallments: number;
}

