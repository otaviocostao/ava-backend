import { Course } from './course.entity';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { CourseDisciplineStatus } from 'src/common/enums/course-discipline-status.enum';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Unique(['course', 'discipline'])
@Entity('courses_disciplines')
export class CourseDiscipline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.courseDisciplines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Discipline, (discipline) => discipline.courseDisciplines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'discipline_id' })
  discipline: Discipline;

  @Column({
    type: 'enum',
    enum: CourseDisciplineStatus,
    default: CourseDisciplineStatus.ACTIVE,
  })
  status: CourseDisciplineStatus;

  @Column({ type: 'int', nullable: true })
  semester: number | null;
}

