import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpStatus, HttpCode } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Post(':courseId/disciplines')
  associateDiscipline(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body('disciplineId', ParseUUIDPipe) disciplineId: string,
  ) {
    return this.coursesService.associateDiscipline(courseId, disciplineId);
  }

  @Delete(':courseId/disciplines/:disciplineId')
  @HttpCode(HttpStatus.OK)
  dissociateDiscipline(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
  ) {
    return this.coursesService.dissociateDiscipline(courseId, disciplineId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.remove(id);
  }
}
