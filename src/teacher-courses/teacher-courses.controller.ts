import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TeacherCoursesService } from './teacher-courses.service';
import { CreateTeacherCourseDto } from './dto/create-teacher-course.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Teacher Courses')
@Controller('teacher-courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TeacherCoursesController {
  constructor(private readonly teacherCoursesService: TeacherCoursesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Vincula um professor a um curso (apenas coordenadores).' })
  create(@Body() createDto: CreateTeacherCourseDto, @Req() req: any) {
    const coordinatorId = req.user.id;
    return this.teacherCoursesService.create(createDto, coordinatorId);
  }

  @Get('teacher/:teacherId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'coordinator')
  @ApiOperation({ summary: 'Lista todos os cursos de um professor.' })
  findAllByTeacher(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.teacherCoursesService.findAllByTeacher(teacherId);
  }

  @Get('course/:courseId')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Lista todos os professores de um curso (apenas coordenadores).' })
  findAllByCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.teacherCoursesService.findAllByCourse(courseId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Busca um vínculo professor-curso específico.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teacherCoursesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Remove o vínculo entre professor e curso (apenas coordenadores).' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const coordinatorId = req.user.id;
    return this.teacherCoursesService.remove(id, coordinatorId);
  }
}

