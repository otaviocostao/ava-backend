import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FileUrlsTransformer } from '../../common/transformers/file-urls.transformer'; 

@Entity('video_lessons')
export class VideoLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Discipline, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discipline_id' })
  @Index('idx_video_lessons_discipline_id')
  discipline: Discipline;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'object_key', type: 'text', nullable: true, unique: true })
  objectKey: string | null;

  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
  durationSeconds: number | null;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    nullable: false, 
    default: 'pending',
    name: 'status'
  })
  @Index('idx_video_lessons_status')
  status: string; // pending | ready | blocked

  @Column({ 
    type: 'varchar', 
    length: 20, 
    nullable: false, 
    default: 'class',
    name: 'visibility'
  })
  visibility: string; // class | private | public

  @Column({ 
    name: 'attachment_urls', 
    type: 'jsonb', 
    nullable: true, 
    default: '[]',
    transformer: new FileUrlsTransformer(),
  })
  attachmentUrls: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by' })
  @Index('idx_video_lessons_uploaded_by')
  uploadedBy: User | null;

  // Campo legado para compatibilidade (será removido após migração)
  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp with time zone', nullable: true })
  uploadedAt: Date | null;
}
