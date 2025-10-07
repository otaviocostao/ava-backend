import { Class } from 'src/classes/entities/class.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity'; 

@Entity('video_lessons')
export class VideoLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({name: 'class_id'})
  class: Class;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 500, name: 'video_url' })
  videoUrl: string;

  @Column()
  duration: number; // Em minutos

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
