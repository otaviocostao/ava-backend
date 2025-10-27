import { Course } from "src/courses/entities/course.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, unique: true, nullable: false })
    name: string;

    @OneToOne(() => User, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'coordinator_id' }) 
    coordinator: User | null;

    @OneToMany(() => Course, (course) => course.department)
    courses: Course[];
}
