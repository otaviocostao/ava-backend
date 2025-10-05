import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("Roles")
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    name: string;
}
