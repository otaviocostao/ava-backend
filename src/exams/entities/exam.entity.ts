import { Activity } from '../../activities/entities/activity.entity';
import { ExamQuestion } from './exam-question.entity';
import { ExamAttempt } from './exam-attempt.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Activity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ name: 'time_limit_minutes', type: 'integer', nullable: true })
  timeLimitMinutes: number | null;

  @Column({ name: 'shuffle_questions', type: 'boolean', default: false })
  shuffleQuestions: boolean;

  @Column({ name: 'shuffle_options', type: 'boolean', default: false })
  shuffleOptions: boolean;

  @Column({ name: 'auto_grade', type: 'boolean', default: true })
  autoGrade: boolean;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any> | null;

  @OneToMany(() => ExamQuestion, (question) => question.exam)
  questions: ExamQuestion[];

  @OneToMany(() => ExamAttempt, (attempt) => attempt.exam)
  attempts: ExamAttempt[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}

