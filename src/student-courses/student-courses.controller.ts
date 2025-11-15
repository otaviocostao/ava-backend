import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentCoursesService } from './student-courses.service';
import { CreateStudentCourseDto } from './dto/create-student-course.dto';
import { User } from 'src/users/entities/user.entity';
import { Course } from 'src/courses/entities/course.entity';

@ApiTags('Student Courses')
@Controller()
export class StudentCoursesController {
  constructor(private readonly service: StudentCoursesService) {}

  @Post('student-courses')
  @ApiOperation({ summary: 'Cria vínculo direto aluno↔curso.' })
  @ApiOkResponse({ description: 'Vínculo criado.' })
  @ApiBadRequestResponse({ description: 'Dados inválidos.' })
  @ApiConflictResponse({ description: 'Vínculo já existe.' })
  @ApiNotFoundResponse({ description: 'Aluno ou curso não encontrados.' })
  create(@Body() dto: CreateStudentCourseDto) {
    return this.service.create(dto);
  }

  @Delete('student-courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove vínculo aluno↔curso.' })
  @ApiNoContentResponse({ description: 'Vínculo removido.' })
  @ApiNotFoundResponse({ description: 'Vínculo não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Get('courses/:courseId/students')
  @ApiOperation({ summary: 'Lista alunos vinculados a um curso.' })
  @ApiOkResponse({ description: 'Lista de alunos do curso.', type: [User] })
  @ApiNotFoundResponse({ description: 'Curso não encontrado (se aplicável).' })
  getStudentsByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.service.findStudentsByCourse(courseId);
  }

  @Get('users/:studentId/courses')
  @ApiOperation({ summary: 'Lista cursos vinculados a um aluno.' })
  @ApiOkResponse({ description: 'Lista de cursos do aluno.', type: [Course] })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado (se aplicável).' })
  getCoursesByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.findCoursesByStudent(studentId);
  }
}


