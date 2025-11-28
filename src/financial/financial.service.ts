import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, In } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from './entities/expense.entity';
import { DefaultingContact } from './entities/defaulting-contact.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { StorageService } from '../storage/storage.service';
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
import { FinancialSummaryQueryDto, FinancialPeriod } from './dto/query/financial-summary-query.dto';
import { DefaultingStudentsQueryDto } from './dto/query/defaulting-students-query.dto';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(DefaultingContact)
    private readonly defaultingContactRepository: Repository<DefaultingContact>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly storageService: StorageService,
  ) {}

  private formatMonthYear(date: Date | string): string {
    const normalizedDate = this.ensureDate(date);
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return `${months[normalizedDate.getMonth()]} ${normalizedDate.getFullYear()}`;
  }

  private ensureDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private nullableDate(value?: Date | string | null): Date | null {
    if (!value) {
      return null;
    }
    return this.ensureDate(value);
  }

  private getPeriodDates(period: FinancialPeriod, startDate?: Date, endDate?: Date): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = endDate || now;

    if (startDate) {
      start = startDate;
    } else {
      switch (period) {
        case FinancialPeriod.MONTH:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case FinancialPeriod.QUARTER:
          const quarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case FinancialPeriod.SEMESTER:
          const semester = Math.floor(now.getMonth() / 6);
          start = new Date(now.getFullYear(), semester * 6, 1);
          break;
        case FinancialPeriod.YEAR:
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), 0, 1);
      }
    }

    return { start, end };
  }

  async getStudentFinancialSummary(
    studentId: string,
    query?: FinancialSummaryQueryDto,
  ): Promise<FinancialSummaryResponseDto> {
    const { start, end } = this.getPeriodDates(
      query?.period || FinancialPeriod.YEAR,
      query?.startDate ? new Date(query.startDate) : undefined,
      query?.endDate ? new Date(query.endDate) : undefined,
    );

    const payments = await this.paymentRepository.find({
      where: {
        student: { id: studentId },
        dueDate: Between(start, end),
      },
    });

    const totalAnnual = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPaid = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPending = payments
      .filter((p) => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.OVERDUE)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const accumulatedDiscount = payments.reduce((sum, p) => sum + (Number(p.discount) || 0), 0);

    const pendingPayments = payments
      .filter((p) => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.SCHEDULED)
      .sort(
        (a, b) =>
          this.ensureDate(a.dueDate).getTime() - this.ensureDate(b.dueDate).getTime(),
      );

    const nextDueDate =
      pendingPayments.length > 0 ? this.ensureDate(pendingPayments[0].dueDate).toISOString() : null;

    const totalInstallments = payments.length;

    return {
      totalAnnual,
      totalPaid,
      totalPending,
      nextDueDate,
      accumulatedDiscount,
      totalInstallments,
    };
  }

  async getStudentInstallments(studentId: string): Promise<InstallmentResponseDto[]> {
    const payments = await this.paymentRepository.find({
      where: { student: { id: studentId } },
      order: { dueDate: 'ASC' },
    });

    return payments.map((payment) => {
      const dueDate = this.ensureDate(payment.dueDate);
      const paidAt = this.nullableDate(payment.paidAt);
      return {
        id: payment.id,
        month: this.formatMonthYear(dueDate),
        year: dueDate.getFullYear(),
        value: Number(payment.amount),
        dueDate: dueDate.toISOString(),
        status: payment.status,
        paymentDate: paidAt?.toISOString() || null,
        discount: Number(payment.discount) || 0,
        installmentNumber: payment.installmentNumber || 1,
        totalInstallments: payment.totalInstallments || 1,
      };
    });
  }

  async getStudentPayments(
    studentId: string,
    status?: PaymentStatus,
    startDate?: string,
    endDate?: string,
  ): Promise<PaymentResponseDto[]> {
    const where: any = { student: { id: studentId } };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.paidAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.paidAt = Between(new Date(startDate), new Date());
    }

    const payments = await this.paymentRepository.find({
      where,
      order: { paidAt: 'DESC' },
    });

    return payments
      .filter((p) => p.paidAt !== null)
      .map((payment) => {
        const paidAt = this.ensureDate(payment.paidAt!);
        return {
          id: payment.id,
          description: payment.description || 'Pagamento',
          value: Number(payment.amount),
          paymentDate: paidAt.toISOString(),
          method: payment.method || null,
          status: payment.status,
          receiptUrl: payment.receiptUrl || null,
          installmentId: payment.id,
        };
      });
  }

  async getReceiptFile(studentId: string, paymentId: string): Promise<{ buffer: Buffer; fileName: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, student: { id: studentId } },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    if (!payment.receiptUrl) {
      throw new NotFoundException('Comprovante não disponível para este pagamento');
    }

    const path = this.storageService.extractPathFromUrl(payment.receiptUrl, 'receipts');
    if (!path) {
      throw new NotFoundException('URL do comprovante inválida');
    }

    return this.storageService.downloadFileFrom('receipts', path);
  }

  async createPayment(studentId: string, createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: createPaymentDto.installmentId, student: { id: studentId } },
    });

    if (!payment) {
      throw new NotFoundException('Parcela não encontrada');
    }

    payment.method = createPaymentDto.method;
    payment.amount = createPaymentDto.value;

    return this.paymentRepository.save(payment);
  }

  async getAdminFinancialSummary(query?: FinancialSummaryQueryDto): Promise<AdminFinancialSummaryResponseDto> {
    const { start, end } = this.getPeriodDates(
      query?.period || FinancialPeriod.MONTH,
      query?.startDate ? new Date(query.startDate) : undefined,
      query?.endDate ? new Date(query.endDate) : undefined,
    );

    const [paidPayments, allPayments, expenses, allStudentsResult] = await Promise.all([
      this.paymentRepository.find({
        where: {
          status: PaymentStatus.PAID,
          paidAt: Between(start, end),
        },
      }),
      this.paymentRepository.find({
        where: {
          dueDate: Between(start, end),
        },
        relations: ['student'],
      }),
      this.expenseRepository.find({
        where: {
          expenseDate: Between(start, end),
        },
      }),
      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role')
        .where('role.name = :roleName', { roleName: 'student' })
        .getMany(),
    ]);

    const allStudents = allStudentsResult;

    const monthlyRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const monthlyExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = monthlyRevenue - monthlyExpenses;

    const overduePayments = allPayments.filter((p) => p.status === PaymentStatus.OVERDUE);
    const defaultRate = allPayments.length > 0 ? (overduePayments.length / allPayments.length) * 100 : 0;

    const defaultingStudentIds = new Set(
      overduePayments.filter((p) => p.student).map((p) => p.student.id),
    );
    const defaultingStudents = defaultingStudentIds.size;
    const totalStudents = allStudents.length;

    const profitMargin = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;

    return {
      monthlyRevenue,
      monthlyExpenses,
      netProfit,
      defaultRate,
      totalStudents,
      defaultingStudents,
      profitMargin,
    };
  }

  async getRevenueEvolution(query?: FinancialSummaryQueryDto): Promise<FinancialEvolutionResponseDto[]> {
    const { start, end } = this.getPeriodDates(
      query?.period || FinancialPeriod.YEAR,
      query?.startDate ? new Date(query.startDate) : undefined,
      query?.endDate ? new Date(query.endDate) : undefined,
    );

    const payments = await this.paymentRepository.find({
      where: {
        paidAt: Between(start, end),
        status: PaymentStatus.PAID,
      },
    });

    const expenses = await this.expenseRepository.find({
      where: {
        expenseDate: Between(start, end),
      },
    });

    const grouped: Map<string, { revenue: number; expenses: number }> = new Map();

    payments.forEach((p) => {
      const paidAt = this.ensureDate(p.paidAt!);
      const key = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
      const current = grouped.get(key) || { revenue: 0, expenses: 0 };
      current.revenue += Number(p.amount);
      grouped.set(key, current);
    });

    expenses.forEach((e) => {
      const key = `${e.expenseDate.getFullYear()}-${String(e.expenseDate.getMonth() + 1).padStart(2, '0')}`;
      const current = grouped.get(key) || { revenue: 0, expenses: 0 };
      current.expenses += Number(e.amount);
      grouped.set(key, current);
    });

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    return Array.from(grouped.entries())
      .sort()
      .map(([period, data]) => ({
        period: months[parseInt(period.split('-')[1], 10) - 1],
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }));
  }

  async getRevenueByCategory(query?: FinancialSummaryQueryDto): Promise<RevenueCategoryResponseDto[]> {
    const { start, end } = this.getPeriodDates(
      query?.period || FinancialPeriod.YEAR,
      query?.startDate ? new Date(query.startDate) : undefined,
      query?.endDate ? new Date(query.endDate) : undefined,
    );

    const payments = await this.paymentRepository.find({
      where: {
        paidAt: Between(start, end),
        status: PaymentStatus.PAID,
      },
    });

    const grouped = new Map<string, number>();
    let total = 0;

    payments.forEach((p) => {
      const category = p.category || 'other';
      const current = grouped.get(category) || 0;
      const amount = Number(p.amount);
      grouped.set(category, current + amount);
      total += amount;
    });

    return Array.from(grouped.entries()).map(([category, value]) => ({
      category: category as any,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }));
  }

  async getExpensesByCategory(query?: FinancialSummaryQueryDto): Promise<ExpenseCategoryResponseDto[]> {
    const { start, end } = this.getPeriodDates(
      query?.period || FinancialPeriod.YEAR,
      query?.startDate ? new Date(query.startDate) : undefined,
      query?.endDate ? new Date(query.endDate) : undefined,
    );

    const expenses = await this.expenseRepository.find({
      where: {
        expenseDate: Between(start, end),
      },
    });

    const grouped = new Map<string, number>();
    let total = 0;

    expenses.forEach((e) => {
      const current = grouped.get(e.category) || 0;
      const amount = Number(e.amount);
      grouped.set(e.category, current + amount);
      total += amount;
    });

    return Array.from(grouped.entries()).map(([category, value]) => ({
      category: category as any,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }));
  }

  async getDefaultingStudents(query?: DefaultingStudentsQueryDto): Promise<DefaultingStudentResponseDto[]> {
    const overduePayments = await this.paymentRepository.find({
      where: { status: PaymentStatus.OVERDUE },
      relations: ['student'],
    });

    const studentMap = new Map<string, { payments: Payment[]; student: User }>();

    overduePayments.forEach((payment) => {
      const studentId = payment.student.id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, { payments: [], student: payment.student });
      }
      studentMap.get(studentId)!.payments.push(payment);
    });

    let results: Array<{ student: User; payments: Payment[]; totalDue: number; monthsOverdue: number }> = [];

    for (const [studentId, data] of studentMap.entries()) {
      if (query?.search) {
        const searchLower = query.search.toLowerCase();
        if (
          !data.student.name.toLowerCase().includes(searchLower) &&
          !data.student.email.toLowerCase().includes(searchLower)
        ) {
          continue;
        }
      }

      const totalDue = data.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const oldestOverdue = data.payments.sort(
        (a, b) =>
          this.ensureDate(a.dueDate).getTime() - this.ensureDate(b.dueDate).getTime(),
      )[0];
      const monthsOverdue = Math.max(
        0,
        Math.floor(
          (new Date().getTime() - this.ensureDate(oldestOverdue.dueDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30),
        ),
      );

      if (query?.minMonths !== undefined && monthsOverdue < query.minMonths) {
        continue;
      }
      if (query?.maxMonths !== undefined && monthsOverdue > query.maxMonths) {
        continue;
      }

      results.push({ student: data.student, payments: data.payments, totalDue, monthsOverdue });
    }

    if (query?.classId) {
      const enrollments = await this.enrollmentRepository.find({
        where: { class: { id: query.classId } },
        relations: ['student', 'class'],
      });
      const enrolledStudentIds = new Set(enrollments.map((e) => e.student.id));
      results = results.filter((r) => enrolledStudentIds.has(r.student.id));
    }

    const studentIds = results.map((r) => r.student.id);
    const lastContacts = await this.defaultingContactRepository.find({
      where: { student: In(studentIds) },
      order: { contactDate: 'DESC' },
    });

    const lastContactMap = new Map<string, Date>();
    lastContacts.forEach((contact) => {
      const studentId = contact.student.id;
      if (!lastContactMap.has(studentId) || lastContactMap.get(studentId)! < contact.contactDate) {
        lastContactMap.set(studentId, contact.contactDate);
      }
    });

    const enrollments = await this.enrollmentRepository.find({
      where: { student: In(studentIds) },
      relations: ['class'],
    });

    const enrollmentMap = new Map<string, { classId: string; className: string }>();
    enrollments.forEach((e) => {
      if (!enrollmentMap.has(e.student.id)) {
        enrollmentMap.set(e.student.id, { classId: e.class.id, className: e.class.code });
      }
    });

    return results.map((result) => {
      const enrollment = enrollmentMap.get(result.student.id);
      const installments = result.payments.map((p) => {
        const dueDate = this.ensureDate(p.dueDate);
        const paidAt = this.nullableDate(p.paidAt);
        return {
          id: p.id,
          month: this.formatMonthYear(dueDate),
          year: dueDate.getFullYear(),
          value: Number(p.amount),
          dueDate: dueDate.toISOString(),
          status: p.status,
          paymentDate: paidAt?.toISOString() || null,
          discount: Number(p.discount) || 0,
          installmentNumber: p.installmentNumber || 1,
          totalInstallments: p.totalInstallments || 1,
        };
      });

      return {
        id: result.student.id,
        studentId: result.student.id,
        name: result.student.name,
        email: result.student.email,
        phone: result.student.telefone || null,
        classId: enrollment?.classId || null,
        className: enrollment?.className || null,
        totalDue: result.totalDue,
        monthsOverdue: result.monthsOverdue,
        lastContactDate: lastContactMap.get(result.student.id)?.toISOString() || null,
        installments,
      };
    });
  }

  async registerContact(
    studentId: string,
    createDto: CreateDefaultingContactDto,
    adminUserId: string,
  ): Promise<DefaultingContact> {
    const student = await this.userRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const admin = await this.userRepository.findOne({ where: { id: adminUserId } });
    if (!admin) {
      throw new NotFoundException('Usuário administrador não encontrado');
    }

    const contact = this.defaultingContactRepository.create({
      student,
      contactDate: new Date(createDto.contactDate),
      contactMethod: createDto.contactMethod,
      notes: createDto.notes,
      contactedBy: admin,
    });

    return this.defaultingContactRepository.save(contact);
  }

  async getCashFlow(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month',
  ): Promise<CashFlowResponseDto[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const payments = await this.paymentRepository.find({
      where: {
        paidAt: Between(start, end),
        status: PaymentStatus.PAID,
      },
    });

    const expenses = await this.expenseRepository.find({
      where: {
        expenseDate: Between(start, end),
      },
    });

    const grouped = new Map<string, { income: number; outcome: number }>();

    payments.forEach((p) => {
      let key: string;
      const date = this.ensureDate(p.paidAt!);
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      const current = grouped.get(key) || { income: 0, outcome: 0 };
      current.income += Number(p.amount);
      grouped.set(key, current);
    });

    expenses.forEach((e) => {
      let key: string;
      if (groupBy === 'day') {
        key = e.expenseDate.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(e.expenseDate);
        weekStart.setDate(e.expenseDate.getDate() - e.expenseDate.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${e.expenseDate.getFullYear()}-${String(e.expenseDate.getMonth() + 1).padStart(2, '0')}`;
      }
      const current = grouped.get(key) || { income: 0, outcome: 0 };
      current.outcome += Number(e.amount);
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .sort()
      .map(([date, data]) => ({
        date,
        income: data.income,
        outcome: data.outcome,
        balance: data.income - data.outcome,
      }));
  }

  async generateReport(request: ReportRequestDto): Promise<ReportResponseDto> {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fileName = `financial-report-${reportId}.${request.format}`;

    let content = '';

    if (request.format === 'csv') {
      content = await this.generateCsvReport(request);
    } else {
      throw new BadRequestException(`Formato ${request.format} ainda não implementado`);
    }

    const path = `reports/${reportId}/${fileName}`;
    const buffer = Buffer.from(content, 'utf-8');
    const url = await this.storageService.uploadFileTo('receipts', path, buffer, 'text/csv');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      reportId,
      downloadUrl: url,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async generateCsvReport(request: ReportRequestDto): Promise<string> {
    const { start, end } = this.getPeriodDates(
      request.period as any,
      request.startDate ? new Date(request.startDate) : undefined,
      request.endDate ? new Date(request.endDate) : undefined,
    );

    let csv = '';

    switch (request.type) {
      case 'revenue':
        const payments = await this.paymentRepository.find({
          where: {
            paidAt: Between(start, end),
            status: PaymentStatus.PAID,
          },
          relations: ['student'],
        });
        csv = 'Data,Aluno,Valor,Categoria,Método\n';
        payments.forEach((p) => {
          const paidAt = this.ensureDate(p.paidAt!);
          csv += `${paidAt.toISOString().split('T')[0]},${p.student.name},${p.amount},${p.category || 'N/A'},${p.method || 'N/A'}\n`;
        });
        break;

      case 'expenses':
        const expenses = await this.expenseRepository.find({
          where: {
            expenseDate: Between(start, end),
          },
        });
        csv = 'Data,Descrição,Valor,Categoria\n';
        expenses.forEach((e) => {
          csv += `${e.expenseDate.toISOString().split('T')[0]},${e.description},${e.amount},${e.category}\n`;
        });
        break;

      case 'defaulting':
        const defaulting = await this.getDefaultingStudents();
        csv = 'Aluno,Email,Total Devido,Meses em Atraso\n';
        defaulting.forEach((d) => {
          csv += `${d.name},${d.email},${d.totalDue},${d.monthsOverdue}\n`;
        });
        break;

      case 'cash_flow':
        const cashFlow = await this.getCashFlow(start.toISOString(), end.toISOString(), 'day');
        csv = 'Data,Entradas,Saídas,Saldo\n';
        cashFlow.forEach((cf) => {
          csv += `${cf.date},${cf.income},${cf.outcome},${cf.balance}\n`;
        });
        break;

      case 'complete':
        csv = '=== RECEITAS ===\n';
        const allPayments = await this.paymentRepository.find({
          where: {
            paidAt: Between(start, end),
            status: PaymentStatus.PAID,
          },
          relations: ['student'],
        });
        csv += 'Data,Aluno,Valor,Categoria\n';
        allPayments.forEach((p) => {
          const paidAt = this.ensureDate(p.paidAt!);
          csv += `${paidAt.toISOString().split('T')[0]},${p.student.name},${p.amount},${p.category || 'N/A'}\n`;
        });
        csv += '\n=== DESPESAS ===\n';
        const allExpenses = await this.expenseRepository.find({
          where: {
            expenseDate: Between(start, end),
          },
        });
        csv += 'Data,Descrição,Valor,Categoria\n';
        allExpenses.forEach((e) => {
          csv += `${e.expenseDate.toISOString().split('T')[0]},${e.description},${e.amount},${e.category}\n`;
        });
        break;
    }

    return csv;
  }
}

