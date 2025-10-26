import { BeforeInsert, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import * as bcrypt from 'bcrypt';
import { Role } from "src/roles/entities/role.entity";
import { ForumPost } from "src/forum-posts/entities/forum-post.entity";
import { Message } from "src/messages/entities/message.entity";
import { Enrollment } from "src/enrollments/entities/enrollment.entity";
import { Payment } from "src/payments/entities/payment.entity";
import { Class } from "src/classes/entities/class.entity";
import { Availability } from "src/availabilities/entities/availability.entity";
import { Material } from "src/materials/entities/material.entity";
import { VideoLesson } from "src/video-lessons/entities/video-lesson.entity";
import { News } from "src/news/entities/news.entity";
import { Attendance } from "src/attendances/entities/attendance.entity";

@Entity("users")
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;
    
    @Column({unique: true})
    email: string;

    @Column({ name: 'password_hash', select: false })
    password: string;

    @CreateDateColumn({name: 'create_at', type: 'timestamp with time zone'})
    createdAt: Date;
    
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
    updatedAt: Date;

    @BeforeInsert()
    async hashPassword() {
        if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
        }
    }

    @ManyToMany(() => Role, { eager: true })
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
    })
    roles: Role[];

    @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
    enrollments: Enrollment[];

    @OneToMany(() => Attendance, (attendance) => attendance.student)
    attendances: Attendance[];

    @OneToMany(() => Payment, (payment) => payment.student)
    payments: Payment[];

    @OneToMany(() => Class, (classInstance) => classInstance.teacher)
    classesTaught: Class[];

    @OneToMany(() => Availability, (availability) => availability.teacher)
    availabilities: Availability[];
    
    @OneToMany(() => Material, (material) => material.uploadedBy)
    materialsUploaded: Material[];

    @OneToMany(() => VideoLesson, (videoLesson) => videoLesson.uploadedBy)
    videoLessonsUploaded: VideoLesson[];

    @OneToMany(() => News, (news) => news.publishedBy)
    newsPublished: News[];

    @OneToMany(() => ForumPost, (post) => post.user)
    forumPosts: ForumPost[];

    @OneToMany(() => Message, (message) => message.sender)
    sentMessages: Message[];

    @OneToMany(() => Message, (message) => message.receiver)
    receivedMessages: Message[];
}
