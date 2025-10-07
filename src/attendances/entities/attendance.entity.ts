import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('attendances')
export class Attendance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Enrollment)
    enrollment: Enrollment;

    date: string;

    @Column({default: false})
    present: boolean;
}
