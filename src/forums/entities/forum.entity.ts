import { Class } from "src/classes/entities/class.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('forums')
export class Forum {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class_id' })
    class: Class;

    @Column({ length: 100, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;
}
