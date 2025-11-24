import { ApiProperty } from '@nestjs/swagger';

export class FinancialEvolutionResponseDto {
  @ApiProperty({ description: 'Período (ex: "Jan", "Fev" ou "2024-01")' })
  period: string;

  @ApiProperty({ description: 'Receita do período' })
  revenue: number;

  @ApiProperty({ description: 'Despesas do período' })
  expenses: number;

  @ApiProperty({ description: 'Lucro do período' })
  profit: number;
}

