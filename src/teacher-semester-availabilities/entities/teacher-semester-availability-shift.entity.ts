import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { TeacherSemesterAvailability } from './teacher-semester-availability.entity';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { ShiftType } from 'src/common/enums/shift-type.enum';

@Entity('teacher_semester_availability_shifts')
@Unique(['availability', 'dayOfWeek', 'shift'])
export class TeacherSemesterAvailabilityShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TeacherSemesterAvailability, (availability) => availability.shifts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'availability_id' })
  availability: TeacherSemesterAvailability;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
    nullable: false,
  })
  dayOfWeek: DayOfWeek;

  @Column({
    type: 'enum',
    enum: ShiftType,
    nullable: false,
  })
  shift: ShiftType;
}



