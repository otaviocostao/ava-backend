import { CourseStatus } from "src/common/enums/course-status.enum";
import { Department } from "src/departments/entities/department.entity";
import { Discipline } from "src/disciplines/entities/discipline.entity";
import { StudentCourse } from "src/student-courses/entities/student-course.entity";
import { CourseDiscipline } from "./course-discipline.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";

@Entity("courses")
export class Course {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, unique: true, nullable: false })
    name: string;

    @Column({ length: 10, unique: true, nullable: true })
    code: string;

    @ManyToOne(() => Department, (department) => department.courses, {
      onDelete: 'CASCADE',
      nullable: true,
    })
    @JoinColumn({ name: 'department_id' }) 
    department: Department;

    @Column({
        type: 'enum', enum: CourseStatus, default: CourseStatus.ACTIVE
    })
    status: CourseStatus;

    @Column({ type: 'int', nullable: true })
    totalHours: number;

    @Column({ type: 'int', nullable: true })
    durationSemesters: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    studentsCount: number;

    @Column({ type: 'int', default: 0 })
    classesCount: number;

    @OneToMany(() => CourseDiscipline, (courseDiscipline) => courseDiscipline.course)
    courseDisciplines: CourseDiscipline[];

    @OneToMany(() => StudentCourse, (studentCourse) => studentCourse.course)
    studentCourses: StudentCourse[];
}
