import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from './entities/course.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { Department } from 'src/departments/entities/department.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Course, Discipline, Department]),
    ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
