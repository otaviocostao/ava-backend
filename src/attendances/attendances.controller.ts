import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@ApiTags('Attendances')
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra a frequencia de um aluno em uma aula especifica.' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de frequencia.' })
  findAll() {
    return this.attendancesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um registro de frequencia pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza o status de presenca de um aluno.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um registro de frequencia.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.remove(id);
  }

  @Get('enrollment/:enrollmentId')
  @ApiOperation({ summary: 'Lista todas as frequencias de uma matricula.' })
  findAllByEnrollment(@Param('enrollmentId', ParseUUIDPipe) enrollmentId: string) {
    return this.attendancesService.findAllByEnrollment(enrollmentId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Lista todas as frequencias vinculadas a um aluno.' })
  findAllByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.attendancesService.findAllByStudent(studentId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista todas as frequencias de uma turma.' })
  findAllByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.attendancesService.findAllByClass(classId);
  }

  @Get('class/:classId/table')
  @ApiOperation({ summary: 'Retorna a tabela de presencas de uma turma para o front.' })
  getAttendanceTable(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.attendancesService.getClassAttendanceTable(classId);
  }
}
