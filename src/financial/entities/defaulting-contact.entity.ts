import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContactMethod } from '../../common/enums/contact-method.enum';
import { User } from '../../users/entities/user.entity';

@Entity('defaulting_contacts')
export class DefaultingContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'contact_date', type: 'timestamp with time zone', nullable: false })
  contactDate: Date;

  @Column({
    type: 'enum',
    enum: ContactMethod,
    nullable: false,
  })
  contactMethod: ContactMethod;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contacted_by' })
  contactedBy: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}

