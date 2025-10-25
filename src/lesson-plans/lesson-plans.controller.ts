import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LessonPlansService } from './lesson-plans.service';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto';

@ApiTags('Lesson Plans')
@Controller('lesson-plans')
export class LessonPlansController {
  constructor(private readonly lessonPlansService: LessonPlansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo plano de aula para uma turma.' })
  create(@Body() createLessonPlanDto: CreateLessonPlanDto) {
    return this.lessonPlansService.create(createLessonPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os planos de aula cadastrados.' })
  findAll() {
    return this.lessonPlansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um plano de aula específico pelo ID.' })
  findOne(@Param('id') id: string) {
    return this.lessonPlansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza informações de um plano de aula.' })
  update(@Param('id') id: string, @Body() updateLessonPlanDto: UpdateLessonPlanDto) {
    return this.lessonPlansService.update(id, updateLessonPlanDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um plano de aula.' })
  remove(@Param('id') id: string) {
    return this.lessonPlansService.remove(id);
  }
}
