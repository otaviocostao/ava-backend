import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { Department } from 'src/departments/entities/department.entity';
import { StudentCourse } from 'src/student-courses/entities/student-course.entity';
import { Class } from 'src/classes/entities/class.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Course, Discipline, Department, StudentCourse, Class]),
    ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
