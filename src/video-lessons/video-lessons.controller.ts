import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { VideoLessonsService } from './video-lessons.service';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';

@Controller('video-lessons')
export class VideoLessonsController {
  constructor(private readonly videoLessonsService: VideoLessonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createVideoLessonDto: CreateVideoLessonDto, @Req() req: any) {
    const uploaderId = req.user.id;
    return this.videoLessonsService.create(createVideoLessonDto, uploaderId);
  }

  @Get('class/:classId')
  findAllByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.findAllByClass(classId, requestingUserId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.findOne(id, requestingUserId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVideoLessonDto: UpdateVideoLessonDto,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.update(
      id,
      updateVideoLessonDto,
      requestingUserId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.remove(id, requestingUserId);
  }
}
