import { VideoLesson } from './video-lesson.entity';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('video_lesson_watches')
@Unique(['videoLesson', 'student'])
export class VideoLessonWatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VideoLesson, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_lesson_id' })
  videoLesson: VideoLesson;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'watched_percentage',
  })
  watchedPercentage: number;

  @CreateDateColumn({ name: 'watched_at', type: 'timestamp with time zone' })
  watchedAt: Date;
}

