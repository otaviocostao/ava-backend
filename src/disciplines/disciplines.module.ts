import { Module } from '@nestjs/common';
import { DisciplinesService } from './disciplines.service';
import { DisciplinesController } from './disciplines.controller';
import { Discipline } from './entities/discipline.entity';
import { Course } from 'src/courses/entities/course.entity';
import { CourseDiscipline } from 'src/courses/entities/course-discipline.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
      TypeOrmModule.forFeature([Discipline, Course, CourseDiscipline]),
    ],
  controllers: [DisciplinesController],
  providers: [DisciplinesService],
})
export class DisciplinesModule {}
