import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactMethod } from '../../common/enums/contact-method.enum';

export class CreateDefaultingContactDto {
  @ApiProperty({ description: 'Data do contato (ISO date)' })
  @IsDateString()
  contactDate: string;

  @ApiProperty({ enum: ContactMethod, description: 'Método de contato' })
  @IsEnum(ContactMethod)
  contactMethod: ContactMethod;

  @ApiProperty({ description: 'Observações do contato', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

