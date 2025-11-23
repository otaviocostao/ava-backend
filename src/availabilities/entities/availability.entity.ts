import { DayOfWeek } from "src/common/enums/day-of-week.enum";
import { User } from "src/users/entities/user.entity";
import { AcademicPeriod } from "src/academic-periods/entities/academic-period.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('availabities')
export class Availability {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
    teacher: User;

    @ManyToOne(() => AcademicPeriod, { nullable: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'academic_period_id' })
    academicPeriod: AcademicPeriod;

    // Coluna temporária para migração - será removida após migração
    @Column({length: 50, nullable: true})
    semester?: string;

    @Column({
        type: 'enum', enum: DayOfWeek, default: null
    })
    dayOfWeek: DayOfWeek;

    @Column({type: 'time with time zone'})
    startTime: string;

    @Column({type: 'time with time zone'})
    endTime: string;
}
