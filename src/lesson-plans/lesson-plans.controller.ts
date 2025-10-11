import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { LessonPlansService } from './lesson-plans.service';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto';

@Controller('lesson-plans')
export class LessonPlansController {
  constructor(private readonly lessonPlansService: LessonPlansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLessonPlanDto: CreateLessonPlanDto) {
    return this.lessonPlansService.create(createLessonPlanDto);
  }

  @Get()
  findAll() {
    return this.lessonPlansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonPlansService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLessonPlanDto: UpdateLessonPlanDto) {
    return this.lessonPlansService.update(id, updateLessonPlanDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.lessonPlansService.remove(id);
  }
}
