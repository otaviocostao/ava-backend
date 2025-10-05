import { Course } from "src/courses/entities/course.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("disciplines")
export class Discipline {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ length: 255, unique: true, nullable: false })
    name: string;

    @ManyToOne(() => Course, (course) => course.disciplines, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'course_id' })
    course: Course;

    @Column({ type: 'int', nullable: true })
    credits: number;
}
