import { Class } from "src/classes/entities/class.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("lesson_plans")
export class LessonPlan {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class_id' })
    class: Class;

    @Column({ type: 'date', nullable: false })
    date: string;

    @Column({ type: 'text', nullable: false })
    content: string;
}
