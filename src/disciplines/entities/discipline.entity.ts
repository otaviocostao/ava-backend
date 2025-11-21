import { Class } from "src/classes/entities/class.entity";
import { CourseDiscipline } from "src/courses/entities/course-discipline.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("disciplines")
export class Discipline {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ length: 255, unique: true, nullable: false })
    name: string;

    @OneToMany(() => CourseDiscipline, (courseDiscipline) => courseDiscipline.discipline)
    courseDisciplines: CourseDiscipline[];

    @Column({ type: 'int', name: 'workload', default: 0 })
    workLoad: number;

    @Column({ type: 'int', nullable: true })
    credits: number;

    @OneToMany(() => Class, (classInstance) => classInstance.discipline)
    classes: Class[];
}
