import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './entities/class.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { User } from 'src/users/entities/user.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';
import { Attendance } from 'src/attendances/entities/attendance.entity';
import { LessonPlan } from 'src/lesson-plans/entities/lesson-plan.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Class, Discipline, User, Enrollment, Schedule, Attendance, LessonPlan]),
    ],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
