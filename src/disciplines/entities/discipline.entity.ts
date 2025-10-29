import { Class } from "src/classes/entities/class.entity";
import { Course } from "src/courses/entities/course.entity";
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("disciplines")
export class Discipline {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ length: 255, unique: true, nullable: false })
    name: string;

    @ManyToMany(() => Course, (course) => course.disciplines)
    courses: Course[];

    @Column({ type: 'int', nullable: true })
    credits: number;

    @OneToMany(() => Class, (classInstance) => classInstance.discipline)
    classes: Class[];
}
