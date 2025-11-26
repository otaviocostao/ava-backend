import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { AcademicPeriod } from 'src/academic-periods/entities/academic-period.entity';
import { AvailabilityStatus } from 'src/common/enums/availability-status.enum';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

@Entity('teacher_semester_availabilities')
@Unique(['teacher', 'academicPeriod'])
export class TeacherSemesterAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @ManyToOne(() => AcademicPeriod, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'academic_period_id' })
  academicPeriod: AcademicPeriod;

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.DRAFT,
  })
  status: AvailabilityStatus;

  @Column({ type: 'boolean', default: false })
  morning: boolean;

  @Column({ type: 'boolean', default: false })
  afternoon: boolean;

  @Column({ type: 'boolean', default: false })
  evening: boolean;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
    array: true,
    default: [],
  })
  weekdays: DayOfWeek[];

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp with time zone', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
  approvedAt: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User | null;

  @ManyToMany(() => Discipline, { cascade: false })
  @JoinTable({
    name: 'teacher_semester_availability_disciplines',
    joinColumn: { name: 'teacher_semester_availability_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'discipline_id', referencedColumnName: 'id' },
  })
  disciplines: Discipline[];
}


