import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('academic_periods')
export class AcademicPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 6, unique: true, nullable: false })
  period: string; // Formato: "YYYY.1" ou "YYYY.2" (ex: "2025.1")

  // IMPORTANTE: Manter nullable: true temporariamente para permitir migração de dados existentes
  // Após executar o script migrate:academic-periods-dates, alterar para nullable: false
  @Column({ name: 'start_date', type: 'timestamp with time zone', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone', nullable: true })
  endDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}


