import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ActivityType } from '../../common/enums/activity-type.enum';
import { ColumnNumericTransformer } from '../../common/transformers/column-numeric.transformer';
import { Class } from 'src/classes/entities/class.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({name: 'class_id'})
  class: Class;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
    default: ActivityType.HOMEWORK,
  })
  type: ActivityType;

  @Column({ type: 'date', nullable: true })
  due_date: Date;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  max_score: number;
}
