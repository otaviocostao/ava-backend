import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherSemesterAvailability } from './entities/teacher-semester-availability.entity';
import { TeacherSemesterAvailabilityShift } from './entities/teacher-semester-availability-shift.entity';
import { TeacherSemesterAvailabilitiesService } from './teacher-semester-availabilities.service';
import { TeacherSemesterAvailabilitiesController } from './teacher-semester-availabilities.controller';
import { User } from 'src/users/entities/user.entity';
import { AcademicPeriod } from 'src/academic-periods/entities/academic-period.entity';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { TeacherCourse } from 'src/teacher-courses/entities/teacher-course.entity';
import { CourseDiscipline } from 'src/courses/entities/course-discipline.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Department } from 'src/departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherSemesterAvailability,
      TeacherSemesterAvailabilityShift,
      User,
      AcademicPeriod,
      Discipline,
      TeacherCourse,
      CourseDiscipline,
      Course,
      Department,
    ]),
  ],
  controllers: [TeacherSemesterAvailabilitiesController],
  providers: [TeacherSemesterAvailabilitiesService],
  exports: [TeacherSemesterAvailabilitiesService],
})
export class TeacherSemesterAvailabilitiesModule {}


