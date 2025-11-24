import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '../../../common/enums/expense-category.enum';

export class ExpenseCategoryResponseDto {
  @ApiProperty({ enum: ExpenseCategory, description: 'Categoria da despesa' })
  category: ExpenseCategory;

  @ApiProperty({ description: 'Valor total da categoria' })
  value: number;

  @ApiProperty({ description: 'Porcentagem do total' })
  percentage: number;
}

