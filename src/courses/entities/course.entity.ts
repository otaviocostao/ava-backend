import { CourseStatus } from "src/common/enums/course-status.enum";
import { Department } from "src/departments/entities/department.entity";
import { Discipline } from "src/disciplines/entities/discipline.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, JoinTable } from "typeorm";

@Entity("courses")
export class Course {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, unique: true, nullable: false })
    name: string;

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

    @ManyToMany(() => Discipline, (discipline) => discipline.courses)
    @JoinTable({
      name: 'courses_disciplines',
      joinColumn: { name: 'course_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'discipline_id', referencedColumnName: 'id' },
    })
    disciplines: Discipline[];
}
