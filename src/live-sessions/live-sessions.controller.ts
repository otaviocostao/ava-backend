import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LiveSessionsService } from './live-sessions.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';

@ApiTags('Live Sessions')
@Controller('live-sessions')
export class LiveSessionsController {
  constructor(private readonly service: LiveSessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria uma sessão de vídeo-chamada para a turma.' })
  create(@Body() dto: CreateLiveSessionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as sessões de vídeo.' })
  findAll() {
    return this.service.findAll();
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista as sessões de vídeo por turma.' })
  findByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.service.findByClassId(classId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma sessão de vídeo.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma sessão de vídeo.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLiveSessionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma sessão de vídeo.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}


