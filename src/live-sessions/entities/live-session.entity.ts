import { Class } from 'src/classes/entities/class.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('live_sessions')
export class LiveSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'timestamp with time zone' })
  startAt: Date;

  @Column({ type: 'timestamp with time zone' })
  endAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meetingUrl: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}


