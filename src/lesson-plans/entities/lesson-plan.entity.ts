import { Class } from "src/classes/entities/class.entity";
import { Schedule } from "src/schedules/entities/schedule.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("lesson_plans")
export class LessonPlan {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class_id' })
    class: Class;

    @ManyToOne(() => Schedule, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'schedule_id' })
    schedule: Schedule | null;

    @Column({ type: 'date', nullable: false })
    date: string;

    @Column({ 
        type: 'varchar', 
        length: 20, 
        nullable: false, 
        default: 'agendada' 
    })
    status: 'agendada' | 'realizada' | 'cancelada';

    @Column({ type: 'text', nullable: false })
    content: string;
}
