import { ApiProperty } from '@nestjs/swagger';

export class AdminFinancialSummaryResponseDto {
  @ApiProperty({ description: 'Receita mensal' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'Despesas mensais' })
  monthlyExpenses: number;

  @ApiProperty({ description: 'Lucro líquido' })
  netProfit: number;

  @ApiProperty({ description: 'Taxa de inadimplência (porcentagem)' })
  defaultRate: number;

  @ApiProperty({ description: 'Total de alunos' })
  totalStudents: number;

  @ApiProperty({ description: 'Alunos inadimplentes' })
  defaultingStudents: number;

  @ApiProperty({ description: 'Margem de lucro (porcentagem)' })
  profitMargin: number;
}

