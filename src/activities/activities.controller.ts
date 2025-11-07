import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { FindActivitiesQueryDto } from './dto/find-activities-query.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';
import { SubmitActivityDto } from './dto/submit-activity.dto';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova atividade acadêmica.' })
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as atividades cadastradas, com filtros opcionais.' })
  findAll(@Query() query: FindActivitiesQueryDto) {
    return this.activitiesService.findAllWithFilters(query);
  }

  @Get('students/:studentId')
  @ApiOperation({ summary: 'Lista todas as atividades do aluno filtradas por studentId.' })
  findByStudentId(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.activitiesService.findByStudentId(studentId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista todas as atividades de uma turma específica.' })
  findByClassId(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.activitiesService.findByClassId(classId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Marca uma atividade como concluída para um estudante.' })
  completeActivity(
    @Param('id', ParseUUIDPipe) activityId: string,
    @Body() completeActivityDto: CompleteActivityDto,
    @Query('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.activitiesService.completeActivity(activityId, studentId);
  }

  @Post(':activityId/submit')
  @ApiOperation({ summary: 'Envia entrega de atividade com upload de arquivos.' })
  submitActivity(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body() submitActivityDto: SubmitActivityDto,
    @Query('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.activitiesService.submitActivity(
      activityId,
      studentId || submitActivityDto.studentId || '',
      submitActivityDto.fileUrl,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recupera os detalhes de uma atividade específica.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma atividade existente.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma atividade do sistema.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.remove(id);
  }
}
