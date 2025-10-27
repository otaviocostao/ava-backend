import { Class } from "src/classes/entities/class.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({ name: 'is_edited', type: 'boolean', default: false })
    isEdited: boolean;

    @Column({ name: 'edited_at', type: 'timestamp with time zone', nullable: true })
    editedAt: Date | null;

    @Column({ name: 'is_recalled', type: 'boolean', default: false })
    isRecalled: boolean;

    @Column({ name: 'recalled_at', type: 'timestamp with time zone', nullable: true })
    recalledAt: Date | null;

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

    @Column({ name: 'is_read', type: 'boolean', default: false })
    isRead: boolean;

    @Column({ name: 'read_at', type: 'timestamp with time zone', nullable: true })
    readAt: Date | null;

    @Column({ name: 'is_archived', type: 'boolean', default: false })
    isArchived: boolean;

    @Column({ name: 'archived_at', type: 'timestamp with time zone', nullable: true })
    archivedAt: Date | null;

}
