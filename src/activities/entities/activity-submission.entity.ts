import { Activity } from './activity.entity';
import { User } from '../../users/entities/user.entity';
import { ActivitySubmissionStatus } from '../../common/enums/activity-submission-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('activity_submissions')
@Unique(['activity', 'student'])
export class ActivitySubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Activity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({
    type: 'enum',
    enum: ActivitySubmissionStatus,
    default: ActivitySubmissionStatus.PENDING,
  })
  status: ActivitySubmissionStatus;

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl: string | null;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamp with time zone', nullable: true })
  submittedAt: Date | null;
}

