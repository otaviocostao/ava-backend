import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FinancialSummaryResponseDto } from './dto/student/financial-summary-response.dto';
import { InstallmentResponseDto } from './dto/student/installment-response.dto';
import { PaymentResponseDto } from './dto/student/payment-response.dto';
import { AdminFinancialSummaryResponseDto } from './dto/admin/admin-summary-response.dto';
import { FinancialEvolutionResponseDto } from './dto/admin/financial-evolution-response.dto';
import { RevenueCategoryResponseDto } from './dto/admin/revenue-category-response.dto';
import { ExpenseCategoryResponseDto } from './dto/admin/expense-category-response.dto';
import { DefaultingStudentResponseDto } from './dto/admin/defaulting-student-response.dto';
import { CashFlowResponseDto } from './dto/admin/cash-flow-response.dto';
import { ReportRequestDto, ReportResponseDto } from './dto/admin/report-request.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateDefaultingContactDto } from './dto/create-defaulting-contact.dto';
import { FinancialSummaryQueryDto } from './dto/query/financial-summary-query.dto';
import { DefaultingStudentsQueryDto } from './dto/query/defaulting-students-query.dto';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { IsEnum, IsOptional, IsDateString, IsIn } from 'class-validator';

class GetStudentPaymentsQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

class GetCashFlowQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}

@ApiTags('Financial')
@Controller('financial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('students/:studentId/summary')
  @ApiOperation({ summary: 'Obter resumo financeiro do aluno' })
  @ApiResponse({ type: FinancialSummaryResponseDto })
  async getStudentSummary(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: FinancialSummaryQueryDto,
    @CurrentUser() user: any,
  ): Promise<FinancialSummaryResponseDto> {
    if (user.id !== studentId && !user.roles?.includes('admin')) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.financialService.getStudentFinancialSummary(studentId, query);
  }

  @Get('students/:studentId/installments')
  @ApiOperation({ summary: 'Listar parcelas/mensalidades do aluno' })
  @ApiResponse({ type: [InstallmentResponseDto] })
  async getStudentInstallments(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: any,
  ): Promise<InstallmentResponseDto[]> {
    if (user.id !== studentId && !user.roles?.includes('admin')) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.financialService.getStudentInstallments(studentId);
  }

  @Get('students/:studentId/payments')
  @ApiOperation({ summary: 'Listar histórico de pagamentos do aluno' })
  @ApiResponse({ type: [PaymentResponseDto] })
  async getStudentPayments(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: GetStudentPaymentsQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaymentResponseDto[]> {
    if (user.id !== studentId && !user.roles?.includes('admin')) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.financialService.getStudentPayments(studentId, query.status, query.startDate, query.endDate);
  }

  @Get('students/:studentId/receipts/:paymentId')
  @ApiOperation({ summary: 'Download de comprovante de pagamento' })
  async downloadReceipt(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Res() res: Response,
    @CurrentUser() user: any,
  ): Promise<void> {
    if (user.id !== studentId && !user.roles?.includes('admin')) {
      throw new ForbiddenException('Acesso negado');
    }
    const { buffer, fileName } = await this.financialService.getReceiptFile(studentId, paymentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Post('students/:studentId/payments')
  @ApiOperation({ summary: 'Criar pagamento (integração futura com gateway)' })
  async createPayment(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: any,
  ) {
    if (user.id !== studentId && !user.roles?.includes('admin')) {
      throw new ForbiddenException('Acesso negado');
    }
    return this.financialService.createPayment(studentId, createPaymentDto);
  }

  @Get('admin/summary')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Resumo financeiro geral (administrador)' })
  @ApiResponse({ type: AdminFinancialSummaryResponseDto })
  async getAdminSummary(@Query() query: FinancialSummaryQueryDto): Promise<AdminFinancialSummaryResponseDto> {
    return this.financialService.getAdminFinancialSummary(query);
  }

  @Get('admin/revenue/evolution')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Evolução de receitas, despesas e lucro por período' })
  @ApiResponse({ type: [FinancialEvolutionResponseDto] })
  async getRevenueEvolution(@Query() query: FinancialSummaryQueryDto): Promise<FinancialEvolutionResponseDto[]> {
    return this.financialService.getRevenueEvolution(query);
  }

  @Get('admin/revenue/by-category')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Receitas agrupadas por categoria' })
  @ApiResponse({ type: [RevenueCategoryResponseDto] })
  async getRevenueByCategory(@Query() query: FinancialSummaryQueryDto): Promise<RevenueCategoryResponseDto[]> {
    return this.financialService.getRevenueByCategory(query);
  }

  @Get('admin/expenses/by-category')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Despesas agrupadas por categoria' })
  @ApiResponse({ type: [ExpenseCategoryResponseDto] })
  async getExpensesByCategory(@Query() query: FinancialSummaryQueryDto): Promise<ExpenseCategoryResponseDto[]> {
    return this.financialService.getExpensesByCategory(query);
  }

  @Get('admin/defaulting-students')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Lista de alunos inadimplentes' })
  @ApiResponse({ type: [DefaultingStudentResponseDto] })
  async getDefaultingStudents(@Query() query: DefaultingStudentsQueryDto): Promise<DefaultingStudentResponseDto[]> {
    return this.financialService.getDefaultingStudents(query);
  }

  @Post('admin/defaulting-students/:studentId/contact')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Registrar contato com aluno inadimplente' })
  async registerContact(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() createDto: CreateDefaultingContactDto,
    @CurrentUser() user: any,
  ) {
    return this.financialService.registerContact(studentId, createDto, user.id);
  }

  @Get('admin/cash-flow')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Fluxo de caixa' })
  @ApiResponse({ type: [CashFlowResponseDto] })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  async getCashFlow(@Query() query: GetCashFlowQueryDto): Promise<CashFlowResponseDto[]> {
    return this.financialService.getCashFlow(query.startDate, query.endDate, query.groupBy || 'day');
  }

  @Post('admin/reports/generate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Gerar relatório financeiro' })
  @ApiResponse({ type: ReportResponseDto })
  async generateReport(@Body() request: ReportRequestDto): Promise<ReportResponseDto> {
    return this.financialService.generateReport(request);
  }
}

