import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TeacherSemesterAvailabilitiesService } from './teacher-semester-availabilities.service';
import { CreateTeacherSemesterAvailabilityDto } from './dto/create-teacher-semester-availability.dto';
import { UpdateTeacherSemesterAvailabilityDto } from './dto/update-teacher-semester-availability.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Teacher Semester Availabilities')
@Controller('teacher-semester-availabilities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TeacherSemesterAvailabilitiesController {
  constructor(
    private readonly availabilitiesService: TeacherSemesterAvailabilitiesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ 
    summary: 'Cria ou atualiza uma disponibilização de horários do professor para um semestre.',
    description: 'O campo academicPeriodId aceita UUID ou string de período (ex: "2026.2")',
  })
  create(
    @Body() createDto: CreateTeacherSemesterAvailabilityDto,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.availabilitiesService.create(createDto, requestingUserId);
  }

  @Get('teacher/:teacherId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'coordinator')
  @ApiOperation({ summary: 'Lista todas as disponibilizações de um professor.' })
  findAllByTeacher(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.availabilitiesService.findAllByTeacher(teacherId);
  }

  @Get('teacher/:teacherId/semester/:semesterId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'coordinator')
  @ApiOperation({ 
    summary: 'Busca a disponibilização de um professor para um semestre específico.',
    description: 'Aceita tanto UUID do período acadêmico quanto a string do período (ex: "2026.2")',
  })
  findOneByTeacherAndSemester(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Param('semesterId') semesterId: string,
  ) {
    return this.availabilitiesService.findOneByTeacherAndSemester(teacherId, semesterId);
  }

  @Get('teacher/:teacherId/available-semesters')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Lista os semestres futuros disponíveis para seleção pelo professor.' })
  findAvailableSemesters(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.availabilitiesService.findAvailableSemestersForTeacher(teacherId);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Lista todas as disponibilizações pendentes de aprovação (apenas para coordenadores).' })
  findPending() {
    return this.availabilitiesService.findPending();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'coordinator')
  @ApiOperation({ summary: 'Busca uma disponibilização específica pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.availabilitiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('teacher')
  @ApiOperation({ summary: 'Atualiza uma disponibilização (apenas o próprio professor pode editar).' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTeacherSemesterAvailabilityDto,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.availabilitiesService.update(id, updateDto, requestingUserId);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Aprova uma disponibilização enviada (apenas para coordenadores).' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const coordinatorId = req.user.id;
    return this.availabilitiesService.approve(id, coordinatorId);
  }

  @Get('course/:courseId/semester/:semesterId/summary')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ 
    summary: 'Resumo de disponibilizações por curso e semestre (apenas coordenadores).',
    description: 'Aceita tanto UUID do período acadêmico quanto a string do período (ex: "2026.2")',
  })
  findSummaryByCourseAndSemester(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('semesterId') semesterId: string,
    @Req() req: any,
  ) {
    const coordinatorId = req.user.id;
    return this.availabilitiesService.findSummaryByCourseAndSemester(
      courseId,
      semesterId,
      coordinatorId,
    );
  }
}

