import { Class } from '../../classes/entities/class.entity';
import { AcademicEventType } from '../../common/enums/academic-event-type.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('academic_events')
export class AcademicEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({
    type: 'enum',
    enum: AcademicEventType,
    default: AcademicEventType.SPECIAL_EVENT,
  })
  type: AcademicEventType;

  @ManyToOne(() => Class, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class | null;
}

