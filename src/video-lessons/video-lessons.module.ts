import { Module } from '@nestjs/common';
import { VideoLessonsService } from './video-lessons.service';
import { VideoLessonsController } from './video-lessons.controller';
import { VideoLesson } from './entities/video-lesson.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VideoLesson, Class, Enrollment]),
  ],
  controllers: [VideoLessonsController],
  providers: [VideoLessonsService],
})
export class VideoLessonsModule {}
