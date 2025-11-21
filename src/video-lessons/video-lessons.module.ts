import { Module } from '@nestjs/common';
import { VideoLessonsService } from './video-lessons.service';
import { VideoLessonsController } from './video-lessons.controller';
import { VideoLesson } from './entities/video-lesson.entity';
import { VideoLessonWatch } from './entities/video-lesson-watch.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { User } from 'src/users/entities/user.entity';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { Department } from 'src/departments/entities/department.entity';
import { CourseDiscipline } from 'src/courses/entities/course-discipline.entity';
import { StorageModule } from 'src/storage/storage.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoLesson, VideoLessonWatch, Class, Enrollment, User, Discipline, Department, CourseDiscipline]),
    StorageModule,
    PassportModule,
  ],
  controllers: [VideoLessonsController],
  providers: [VideoLessonsService],
  exports: [VideoLessonsService],
})
export class VideoLessonsModule {}
