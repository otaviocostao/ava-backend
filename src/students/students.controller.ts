import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get(':studentId/dashboard-summary')
  @ApiOperation({ summary: 'Retorna resumo consolidado do aluno (frequência geral, média geral e atividades pendentes).' })
  getDashboardSummary(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.studentsService.getDashboardSummary(studentId);
  }

  @Get(':studentId/next-classes')
  @ApiOperation({ summary: 'Lista próximas aulas do aluno baseadas nos horários e matrículas.' })
  getNextClasses(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.studentsService.getNextClasses(studentId);
  }

  @Get(':studentId/recent-grades')
  @ApiOperation({ summary: 'Retorna as últimas notas do aluno para o dashboard.' })
  getRecentGrades(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 5;
    return this.studentsService.getRecentGrades(studentId, limitNumber);
  }

  @Get(':studentId/pending-activities-count')
  @ApiOperation({ summary: 'Conta atividades por status (pendente/concluída).' })
  getPendingActivitiesCount(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.studentsService.getPendingActivitiesCount(studentId);
  }

  @Get(':studentId/performance-metrics')
  @ApiOperation({ summary: 'Retorna métricas consolidadas (média geral, melhor nota, disciplinas aprovadas).' })
  getPerformanceMetrics(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.studentsService.getPerformanceMetrics(studentId);
  }

  @Get(':studentId/achievements')
  @ApiOperation({ summary: 'Retorna conquistas/gamificação do aluno.' })
  getAchievements(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.studentsService.getAchievements(studentId);
  }

  @Get(':studentId/disciplines')
  @ApiOperation({ summary: 'Lista disciplinas do aluno baseadas nas matrículas.' })
  getDisciplines(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.studentsService.getDisciplines(studentId);
  }

  @Get(':studentId/classes')
  @ApiOperation({ summary: 'Lista todos as classes em que o usuário está cadastrado.' })
  findStudentClasses(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.studentsService.findStudentClasses(studentId);
  }

  @Get(':studentId/completed-hours')
  @ApiOperation({ summary: 'Calcula carga horária cumprida pelo aluno.' })
  getCompletedHours(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.studentsService.getCompletedHours(studentId);
  }
}

