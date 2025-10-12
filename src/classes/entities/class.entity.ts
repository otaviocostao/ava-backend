import { Activity } from "src/activities/entities/activity.entity";
import { Discipline } from "src/disciplines/entities/discipline.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Forum } from "src/forums/entities/forum.entity";
import { LessonPlan } from "src/lesson-plans/entities/lesson-plan.entity";
import { Material } from "src/materials/entities/material.entity";
import { Schedule } from "src/schedules/entities/schedule.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

  // Relacionamentos com outras entidades
  
  @ManyToOne(() => Discipline, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discipline_id' })
  discipline: Discipline;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.class)
  enrollments: Enrollment[];

  @OneToMany(() => Material, (material) => material.class)
  materials: Material[];

  @OneToMany(() => Activity, (activity) => activity.class)
  activities: Activity[];

  @OneToMany(() => LessonPlan, (lessonPlan) => lessonPlan.class)
  lessonPlans: LessonPlan[];

  @OneToMany(() => Schedule, (schedule) => schedule.class)
  schedules: Schedule[];

  @OneToMany(() => Forum, (forum) => forum.class)
  forums: Forum[];
}
