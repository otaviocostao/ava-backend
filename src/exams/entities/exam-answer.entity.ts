import { ExamAttempt } from './exam-attempt.entity';
import { ExamQuestion } from './exam-question.entity';
import { ColumnNumericTransformer } from '../../common/transformers/column-numeric.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exam_answers')
@Unique(['attempt', 'question'])
export class ExamAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ExamAttempt, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attempt_id' })
  attempt: ExamAttempt;

  @ManyToOne(() => ExamQuestion, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: ExamQuestion;

  @Column({ name: 'answer_data', type: 'jsonb' })
  answerData: { selected_option_id?: string; text?: string };

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect: boolean | null;

  @Column({
    name: 'points_earned',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  pointsEarned: number | null;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  @Column({ name: 'graded_at', type: 'timestamp with time zone', nullable: true })
  gradedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}

