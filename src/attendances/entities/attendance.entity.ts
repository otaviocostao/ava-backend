import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('attendances')
export class Attendance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Enrollment, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'enrollment_id' })
    enrollment: Enrollment;

    @Column({ type: 'date', nullable: false })
    date: string;

    @Column({ type: 'boolean', default: false })
    present: boolean;
}
