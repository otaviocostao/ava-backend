import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Attendance } from '../attendances/entities/attendance.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivitySubmission } from '../activities/entities/activity-submission.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { StudentCourse } from '../student-courses/entities/student-course.entity';
import { CourseDiscipline } from '../courses/entities/course-discipline.entity';
import { Discipline } from '../disciplines/entities/discipline.entity';
import { Class } from '../classes/entities/class.entity';
import { LessonPlan } from '../lesson-plans/entities/lesson-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Enrollment,
      Grade,
      Attendance,
      Activity,
      ActivitySubmission,
      Schedule,
      StudentCourse,
      CourseDiscipline,
      Discipline,
      Class,
      LessonPlan,
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}

