import { Class } from 'src/classes/entities/class.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FileUrlsTransformer } from '../../common/transformers/file-urls.transformer'; 

@Entity('video_lessons')
export class VideoLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({name: 'class_id'})
  @Index('idx_video_lessons_class_id')
  class: Class;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  @Index('idx_video_lessons_teacher_id')
  teacher: User;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'object_key', type: 'text', nullable: true, unique: true })
  objectKey: string;

  @Column({ name: 'file_extension', type: 'varchar', length: 16, nullable: true })
  fileExtension: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 64, nullable: true })
  mimeType: string | null;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes: number | null;

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

  // Campo legado para compatibilidade (será removido após migração)
  @Column({ type: 'varchar', length: 500, name: 'video_url', nullable: true })
  videoUrl: string | null;

  // Campo legado para compatibilidade (será removido após migração)
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User | null;

  // Campo legado para compatibilidade (será removido após migração)
  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp with time zone', nullable: true })
  uploadedAt: Date | null;
}
