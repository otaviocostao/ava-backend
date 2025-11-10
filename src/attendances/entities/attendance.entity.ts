import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('attendances')
export class Attendance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Enrollment, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'enrollment_id' })
    enrollment: Enrollment;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'student_id' })
    student: User;

    @Column({ type: 'int', name: 'class_hour', default: 1 })
    classHour: number;

    @Column({ type: 'date', nullable: false })
    date: string;

    @Column({ type: 'boolean', default: false })
    present: boolean;
}
