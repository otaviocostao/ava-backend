import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VideoLessonsService } from './video-lessons.service';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';

@Controller('video-lessons')
export class VideoLessonsController {
  constructor(private readonly videoLessonsService: VideoLessonsService) {}

  @Post()
  create(@Body() createVideoLessonDto: CreateVideoLessonDto) {
    return this.videoLessonsService.create(createVideoLessonDto);
  }

  @Get()
  findAll() {
    return this.videoLessonsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.videoLessonsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVideoLessonDto: UpdateVideoLessonDto) {
    return this.videoLessonsService.update(id, updateVideoLessonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videoLessonsService.remove(id);
  }
}
