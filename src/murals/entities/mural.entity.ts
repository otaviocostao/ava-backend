import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum MuralTargetRole {
  ALUNO = 'aluno',
  PROFESSOR = 'professor',
}

@Entity('murals')
export class Mural {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: false })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: MuralTargetRole,
    nullable: false,
  })
  targetRole: MuralTargetRole;

  @Column({ type: 'int', nullable: true, default: null })
  order: number | null;

  @Column({ type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}

