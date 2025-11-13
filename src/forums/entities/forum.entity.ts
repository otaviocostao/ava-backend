import { Class } from "src/classes/entities/class.entity";
import { ForumPost } from "src/forum-posts/entities/forum-post.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";

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

    @OneToMany(() => ForumPost, (post) => post.forum)
    posts: ForumPost[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt: Date;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;
}
