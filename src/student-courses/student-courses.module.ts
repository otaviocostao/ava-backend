import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentCourse } from './entities/student-course.entity';
import { StudentCoursesService } from './student-courses.service';
import { StudentCoursesController } from './student-courses.controller';
import { User } from 'src/users/entities/user.entity';
import { Course } from 'src/courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentCourse, User, Course])],
  controllers: [StudentCoursesController],
  providers: [StudentCoursesService],
  exports: [StudentCoursesService],
})
export class StudentCoursesModule {}


