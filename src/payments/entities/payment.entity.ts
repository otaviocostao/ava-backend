import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  student_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;
}
