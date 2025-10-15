import { Class } from "src/classes/entities/class.entity";
import { ForumPost } from "src/forum-posts/entities/forum-post.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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
}
