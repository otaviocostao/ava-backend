import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VideoLessonsService } from './video-lessons.service';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';

@ApiTags('Video Lessons')
@Controller('video-lessons')
export class VideoLessonsController {
  constructor(private readonly videoLessonsService: VideoLessonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publica uma nova videoaula em uma turma.' })
  create(@Body() createVideoLessonDto: CreateVideoLessonDto, @Req() req: any) {
    const uploaderId = req.user.id;
    return this.videoLessonsService.create(createVideoLessonDto, uploaderId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista todas as videoaulas disponíveis para a turma informada.' })
  findAllByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.findAllByClass(classId, requestingUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de uma videoaula específica.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.findOne(id, requestingUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza as informações de uma videoaula criada pelo usuário.' })
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
  @ApiOperation({ summary: 'Remove uma videoaula do acervo da turma.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.remove(id, requestingUserId);
  }
}
