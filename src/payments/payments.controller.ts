import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

class FindPaymentsQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  dueDateStart?: string;

  @IsOptional()
  @IsDateString()
  dueDateEnd?: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gera um novo lancamento financeiro para um aluno.' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista pagamentos filtrando por status e intervalo de vencimento.' })
  findAll(@Query() query: FindPaymentsQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Lista os pagamentos de um aluno especifico.' })
  findAllByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.paymentsService.findAllByStudent(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um pagamento pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza o status de um pagamento (ex.: marcado como pago).' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um lancamento de pagamento.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }

  @Post('run-overdue-check')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Atualiza o status de pagamentos vencidos.' })
  async runOverdueCheck() {
    await this.paymentsService.updateOverduePayments();
    return { message: 'Checagem de pagamentos vencidos executada.' };
  }
}
