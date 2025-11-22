import { Exam } from './exam.entity';
import { ExamAnswer } from './exam-answer.entity';
import { User } from '../../users/entities/user.entity';
import { ExamAttemptStatus } from '../../common/enums/exam-attempt-status.enum';
import { ColumnNumericTransformer } from '../../common/transformers/column-numeric.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exam_attempts')
@Unique(['exam', 'student'])
export class ExamAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exam, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'started_at', type: 'timestamp with time zone' })
  startedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp with time zone', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'time_spent_minutes', type: 'integer', nullable: true })
  timeSpentMinutes: number | null;

  @Column({
    type: 'enum',
    enum: ExamAttemptStatus,
    default: ExamAttemptStatus.IN_PROGRESS,
  })
  status: ExamAttemptStatus;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  score: number | null;

  @Column({
    name: 'auto_grade_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  autoGradeScore: number | null;

  @Column({
    name: 'manual_grade_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  manualGradeScore: number | null;

  @Column({ name: 'graded_at', type: 'timestamp with time zone', nullable: true })
  gradedAt: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'graded_by' })
  gradedBy: User | null;

  @OneToMany(() => ExamAnswer, (answer) => answer.attempt)
  answers: ExamAnswer[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}

