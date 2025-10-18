import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { User } from 'src/users/entities/user.entity';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { studentId, amount, dueDate } = createPaymentDto;

    const student = await this.userRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Aluno com ID "${studentId}" não encontrado.`);
    }

    const newPayment = this.paymentRepository.create({
      student,
      amount,
      dueDate,
      status: PaymentStatus.PENDING,
    });

    return this.paymentRepository.save(newPayment);
  }

  findAllByStudent(studentId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { student: { id: studentId } },
      order: { dueDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!payment) {
      throw new NotFoundException(`Pagamento com ID "${id}" não encontrado.`);
    }
    return payment;
  }


  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    const { status } = updatePaymentDto;

    payment.status = status;

    if (status === PaymentStatus.PAID && !payment.paidAt) {
      payment.paidAt = new Date();
    } else if (status !== PaymentStatus.PAID) {
      payment.paidAt = null;
    }

    return this.paymentRepository.save(payment);
  }
  
  async remove(id: string): Promise<void> {
    const result = await this.paymentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Pagamento com ID "${id}" não encontrado.`);
    }
  }

  async updateOverduePayments(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await this.paymentRepository
      .createQueryBuilder()
      .update(Payment)
      .set({ status: PaymentStatus.OVERDUE })
      .where('dueDate < :today', { today })
      .andWhere('status = :pendingStatus', { pendingStatus: PaymentStatus.PENDING })
      .execute();
  }
}
