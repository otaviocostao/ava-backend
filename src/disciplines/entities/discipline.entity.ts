import { Class } from "src/classes/entities/class.entity";
import { Course } from "src/courses/entities/course.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("disciplines")
export class Discipline {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ length: 255, unique: true, nullable: false })
    name: string;

    @ManyToOne(() => Course, (course) => course.disciplines, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'course_id' })
    course: Course | null;

    @Column({ type: 'int', nullable: true })
    credits: number;

    @OneToMany(() => Class, (classInstance) => classInstance.discipline)
    classes: Class[];
}
