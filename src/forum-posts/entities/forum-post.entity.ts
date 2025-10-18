import { Forum } from "src/forums/entities/forum.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('forum_posts')
export class ForumPost {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Forum, (forum) => forum.posts, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({name: 'forum_id'})
    forum: Forum;

    @ManyToOne(() => User, (user) => user.forumPosts, {
        nullable: false,
        onDelete: 'SET NULL',
    })
    @JoinColumn({name: 'user_id'})
    user: User;

    @Column({type: 'text'})
    content: string
    
    @CreateDateColumn({
        name: 'posted_at',
        type: 'timestamp with time zone', 
    })
    postedAt: Date;
    
    @ManyToOne(() => ForumPost, (post) => post.replies, {
    nullable: true,
    onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'parent_post_id' })
    parentPost: ForumPost | null;

    @Column({ name: 'parent_post_id', nullable: true })
    parentPostId: string;

    @OneToMany(() => ForumPost, (post) => post.parentPost)
    replies: ForumPost[];
}
