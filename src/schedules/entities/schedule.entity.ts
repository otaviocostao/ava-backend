import { Class } from "src/classes/entities/class.entity";
import { DayOfWeek } from "src/common/enums/day-of-week.enum";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('schedules')
export class Schedule {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class_id' })
    class: Class;
    
    @Column({
      type: 'enum',
      enum: DayOfWeek,
      nullable: false,
    })
    dayOfWeek: DayOfWeek;

    @Column({ type: 'time', nullable: false })
    startTime: string;

    @Column({ type: 'time', nullable: false })
    endTime: string;

    @Column({ length: 50, nullable: true })
    room: string;
    
}
