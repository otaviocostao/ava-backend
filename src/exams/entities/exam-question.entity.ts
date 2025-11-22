import { Exam } from './exam.entity';
import { ExamAnswer } from './exam-answer.entity';
import { ExamQuestionType } from '../../common/enums/exam-question-type.enum';
import { ColumnNumericTransformer } from '../../common/transformers/column-numeric.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exam_questions')
export class ExamQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exam, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ type: 'integer' })
  order: number;

  @Column({
    type: 'enum',
    enum: ExamQuestionType,
  })
  type: ExamQuestionType;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  points: number;

  @Column({ type: 'jsonb', nullable: true })
  options: Array<{ id: string; text: string; is_correct: boolean }> | null;

  @Column({ name: 'correct_answer', type: 'jsonb', nullable: true })
  correctAnswer: any | null;

  @Column({ type: 'jsonb', nullable: true })
  rubric: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @OneToMany(() => ExamAnswer, (answer) => answer.question)
  answers: ExamAnswer[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}

