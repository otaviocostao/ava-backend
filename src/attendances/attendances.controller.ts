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
  @ApiOperation({ summary: 'Registra a frequência de um aluno em uma aula específica.' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendancesService.create(createAttendanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros de frequência.' })
  findAll() {
    return this.attendancesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um registro de frequência pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.findOne(id);
  }
  

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza o status de presença de um aluno.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendancesService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um registro de frequência.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendancesService.remove(id);
  }

  @Get('enrollment/:enrollmentId')
  @ApiOperation({ summary: 'Lista todas as frequências de uma matrícula.' })
  findAllByEnrollment(@Param('enrollmentId', ParseUUIDPipe) enrollmentId: string) {
    return this.attendancesService.findAllByEnrollment(enrollmentId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista todas as frequências de uma turma.' })
  findAllByClass(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.attendancesService.findAllByClass(classId);
  }
}
