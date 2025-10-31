import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { User } from 'src/users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

interface FindPaymentsQuery {
  status?: PaymentStatus;
  dueDateStart?: string;
  dueDateEnd?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private parseDate(value: string, fieldName: string): Date {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} deve ser uma data valida (YYYY-MM-DD).`);
    }

    return parsed;
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { studentId, amount, dueDate } = createPaymentDto;

    const student = await this.userRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Aluno com ID "${studentId}" nao encontrado.`);
    }

    const dueDateValue = this.parseDate(dueDate, 'dueDate');

    const payment = this.paymentRepository.create({
      student,
      amount,
      dueDate: dueDateValue,
      status: PaymentStatus.PENDING,
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(query: FindPaymentsQuery): Promise<Payment[]> {
    await this.updateOverduePayments();

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .orderBy('payment.dueDate', 'DESC');

    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }

    let startDate: Date | undefined;
    if (query.dueDateStart) {
      startDate = this.parseDate(query.dueDateStart, 'dueDateStart');
      qb.andWhere('payment.dueDate >= :dueDateStart', { dueDateStart: query.dueDateStart });
    }

    let endDate: Date | undefined;
    if (query.dueDateEnd) {
      endDate = this.parseDate(query.dueDateEnd, 'dueDateEnd');
      qb.andWhere('payment.dueDate <= :dueDateEnd', { dueDateEnd: query.dueDateEnd });
    }

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('dueDateStart deve ser anterior ou igual a dueDateEnd.');
    }

    return qb.getMany();
  }

  async findAllByStudent(studentId: string): Promise<Payment[]> {
    await this.updateOverduePayments();

    return this.paymentRepository.find({
      where: { student: { id: studentId } },
      order: { dueDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    await this.updateOverduePayments();

    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!payment) {
      throw new NotFoundException(`Pagamento com ID "${id}" nao encontrado.`);
    }

    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    payment.status = updatePaymentDto.status;

    if (updatePaymentDto.status === PaymentStatus.PAID) {
      payment.paidAt = new Date();
    } else {
      payment.paidAt = null;
    }

    return this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.paymentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Pagamento com ID "${id}" nao encontrado.`);
    }
  }

  async updateOverduePayments(): Promise<void> {
    const today = this.todayIso();

    await this.paymentRepository
      .createQueryBuilder()
      .update(Payment)
      .set({ status: PaymentStatus.OVERDUE })
      .where('dueDate < :today', { today })
      .andWhere('status = :pendingStatus', { pendingStatus: PaymentStatus.PENDING })
      .execute();
  }
}
