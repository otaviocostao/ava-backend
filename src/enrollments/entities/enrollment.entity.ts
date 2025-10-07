import { Attendance } from "src/attendances/entities/attendance.entity";
import { Class } from "src/classes/entities/class.entity";
import { User } from "src/users/entities/user.entity";
import { CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Unique(['student', 'class'])
@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //Aluno matriculado
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  // Turma que o aluno está matriculado
  @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @CreateDateColumn({ name: 'enrolled_at', type: 'timestamp with time zone' })
  enrolledAt: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.enrollment)
  attendances: Attendance[];
}