import { NewsTargetType } from '../../common/enums/news-target-type.enum';
import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'published_by' })
  publishedBy: User;

  @CreateDateColumn({ name: 'published_at', type: 'timestamp with time zone' })
  publishedAt: Date;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: NewsTargetType,
    nullable: true,
  })
  targetType?: NewsTargetType | null;

  @Column({ name: 'target_id', type: 'varchar', length: 255, nullable: true })
  targetId?: string | null;
}
