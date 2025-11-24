import { ApiProperty } from '@nestjs/swagger';

export class CashFlowResponseDto {
  @ApiProperty({ description: 'Data ou período agrupado (ISO date ou string)' })
  date: string;

  @ApiProperty({ description: 'Entradas (receitas)' })
  income: number;

  @ApiProperty({ description: 'Saídas (despesas)' })
  outcome: number;

  @ApiProperty({ description: 'Saldo (entradas - saídas)' })
  balance: number;
}

