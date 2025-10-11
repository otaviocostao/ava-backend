import { DayOfWeek } from "src/common/enums/day-of-week.enum";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('availabities')
export class Availability {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
    teacher: User;

    @Column({length: 50})
    semester: string;

    @Column({
        type: 'enum', enum: DayOfWeek, default: null
    })
    dayOfWeek: DayOfWeek;

    @Column({type: 'time with time zone'})
    startTime: string;

    @Column({type: 'time with time zone'})
    endTime: string;
}
