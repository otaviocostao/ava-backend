import { Discipline } from "src/disciplines/entities/discipline.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

   // Código da turma para ajudar na localização
  @Column({ length: 50, unique: true, nullable: false })
  code: string;

  // Semestre da turma, em ANO-SEMESTRE (Ex: 2025-2)
  @Column({ length: 50, nullable: false })
  semester: string;

  // Ano letivo da turma
  @Column({ type: 'int', nullable: false })
  year: number;

  
  @ManyToOne(() => Discipline, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discipline_id' })
  discipline: Discipline;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

}
