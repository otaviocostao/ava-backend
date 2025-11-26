import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherCourse } from './entities/teacher-course.entity';
import { TeacherCoursesService } from './teacher-courses.service';
import { TeacherCoursesController } from './teacher-courses.controller';
import { User } from 'src/users/entities/user.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Department } from 'src/departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherCourse, User, Course, Department]),
  ],
  controllers: [TeacherCoursesController],
  providers: [TeacherCoursesService],
  exports: [TeacherCoursesService],
})
export class TeacherCoursesModule {}

