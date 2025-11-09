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

  @Column({ type:'varchar', length: 100, nullable: true })
  unit: string | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
    default: ActivityType.HOMEWORK,
  })
  type: ActivityType;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  maxScore: number;

  @Column({ name: 'attachment_urls', type: 'jsonb', nullable: true })
  attachmentUrls: string[] | null;
}
