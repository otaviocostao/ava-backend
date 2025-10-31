import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@ApiTags('Schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo horario para uma turma.' })
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista toda a grade horaria cadastrada.' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza informacoes de um horario existente.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um horario da grade.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedulesService.remove(id);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista todos os horarios de uma turma especifica.' })
  findByClassId(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.schedulesService.findByClassId(classId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um horario especifico pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedulesService.findOne(id);
  }
}
