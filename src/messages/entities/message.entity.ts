import { Class } from "src/classes/entities/class.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'receiver_id' })
    receiver: User | null;

    @ManyToOne(() => Class, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class_id' })
    class: Class | null;

    @CreateDateColumn({ name: 'sent_at', type: 'timestamp with time zone' })
    sentAt: Date;

    @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'sender_id' })
    sender: User;

}
