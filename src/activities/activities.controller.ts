import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

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
  @ApiOperation({ summary: 'Lista todas as atividades cadastradas.' })
  findAll() {
    return this.activitiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recupera os detalhes de uma atividade específica.' })
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma atividade existente.' })
  update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma atividade do sistema.' })
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
