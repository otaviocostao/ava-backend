import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, Column } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { Course } from "src/courses/entities/course.entity";
import { StudentCourseStatus } from "src/common/enums/student-course-status.enum";

@Unique(['student', 'course'])
@Entity('student_courses')
export class StudentCourse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'entry_semester', length: 10, nullable: false })
  entrySemester: string;

  @Column({ type: 'enum', enum: StudentCourseStatus, default: StudentCourseStatus.ACTIVE })
  status: StudentCourseStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}


