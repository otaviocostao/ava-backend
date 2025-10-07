import { Module } from '@nestjs/common';
import { VideoLessonsService } from './video-lessons.service';
import { VideoLessonsController } from './video-lessons.controller';

@Module({
  controllers: [VideoLessonsController],
  providers: [VideoLessonsService],
})
export class VideoLessonsModule {}
