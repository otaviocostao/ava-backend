import { ApiProperty } from '@nestjs/swagger';
import { PaymentCategory } from '../../../common/enums/payment-category.enum';

export class RevenueCategoryResponseDto {
  @ApiProperty({ enum: PaymentCategory, description: 'Categoria da receita' })
  category: PaymentCategory;

  @ApiProperty({ description: 'Valor total da categoria' })
  value: number;

  @ApiProperty({ description: 'Porcentagem do total' })
  percentage: number;
}

