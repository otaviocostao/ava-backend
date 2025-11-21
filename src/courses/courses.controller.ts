import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ToggleDisciplineStatusDto } from './dto/toggle-discipline-status.dto';
import { AssociateDisciplineDto } from './dto/associate-discipline.dto';
import { UpdateDisciplineSemesterDto } from './dto/update-discipline-semester.dto';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo curso.' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os cursos e suas disciplinas. Pode filtrar por departamento.' })
  @ApiQuery({ name: 'departmentId', required: false, description: 'Filtra cursos por departamento (UUID)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtra cursos por status (ativo e inativo)' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome' })
  findAll(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: 'active' | 'inactive',
    @Query('search') search?: string,

  ) {
    return this.coursesService.findAll({departmentId, status, search});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de um curso específico.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }


  @Get(':id/classes')
  @ApiOperation({ summary: 'Lista as turmas cujas disciplinas pertencem ao curso informado.' })
  findClasses(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findClasses(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza informações de um curso.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Post(':courseId/disciplines')
  @ApiOperation({ summary: 'Associa uma disciplina existente a um curso.' })
  associateDiscipline(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() associateDisciplineDto: AssociateDisciplineDto,
  ) {
    return this.coursesService.associateDiscipline(
      courseId,
      associateDisciplineDto.disciplineId,
      associateDisciplineDto.semester,
    );
  }

  @Patch(':courseId/disciplines/:disciplineId/status')
  @ApiOperation({ summary: 'Atualiza o status de uma disciplina no curso (ativa/inativa).' })
  toggleDisciplineStatus(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Body() toggleDisciplineStatusDto: ToggleDisciplineStatusDto,
  ) {
    return this.coursesService.toggleDisciplineStatus(
      courseId,
      disciplineId,
      toggleDisciplineStatusDto.status,
    );
  }

  @Patch(':courseId/disciplines/:disciplineId/semester')
  @ApiOperation({ summary: 'Atualiza o semestre de uma disciplina no curso.' })
  updateDisciplineSemester(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Body() updateDisciplineSemesterDto: UpdateDisciplineSemesterDto,
  ) {
    return this.coursesService.updateDisciplineSemester(
      courseId,
      disciplineId,
      updateDisciplineSemesterDto.semester,
    );
  }

  @Delete(':courseId/disciplines/:disciplineId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a associação entre um curso e uma disciplina.' })
  dissociateDiscipline(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
  ) {
    return this.coursesService.dissociateDiscipline(courseId, disciplineId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um curso do sistema.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.remove(id);
  }
}
