import { ColumnNumericTransformer } from '../../common/transformers/column-numeric.transformer';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('grades')
@Unique(['enrollment', 'activityId'])
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Enrollment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment;

  @Column({ name: 'activity_id', type: 'uuid' })
  activityId: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  score: number;

  @Column({
    name: 'graded_at',
    type: 'timestamp with time zone',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  gradedAt?: Date | null;
}
