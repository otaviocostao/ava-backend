import { CourseStatus } from "src/common/enums/course-status.enum";
import { Department } from "src/departments/entities/department.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("courses")
export class Course {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, unique: true, nullable: false })
    name: string;

    @ManyToOne(() => Department, (department) => department.courses, {
      onDelete: 'SET NULL',
      nullable: true,
    })
    @JoinColumn({ name: 'department_id' }) 
    department: Department;

    @Column({
        type: 'enum', enum: CourseStatus, default: CourseStatus.ACTIVE
    })
    status: CourseStatus;
}
