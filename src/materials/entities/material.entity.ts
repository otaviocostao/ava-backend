import { Class } from "src/classes/entities/class.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('materials')
export class Material {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Class, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'class_id' })
    class: Class;

    @Column({ length: 255, nullable: false })
    title: string;

    @Column({ name: 'fileUrl', type: 'jsonb', nullable: true })
    fileUrl: string[] | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @ManyToOne(() => User, { nullable: false, onDelete: 'SET NULL' })
    uploadedBy: User;

    @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    uploadedAt: Date;
}
