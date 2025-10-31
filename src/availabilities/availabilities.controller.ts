import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { FindTeacherAvailabilitiesDto } from './dto/find-teacher-availabilities.dto';

@ApiTags('Availabilities')
@Controller('availabilities')
export class AvailabilitiesController {
  constructor(private readonly availabilitiesService: AvailabilitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra a disponibilidade semanal de um professor.' })
  create(@Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilitiesService.create(createAvailabilityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as disponibilidades cadastradas.' })
  findAll() {
    return this.availabilitiesService.findAll();
  }

  @Get('teachers/:teacherId/availabilities')
  @ApiOperation({ summary: 'Lista todas as disponibilidades de um professor especifico.' })
  @ApiQuery({ name: 'semester', required: false, description: 'Filtrar por semestre especifico' })
  @ApiQuery({ name: 'dayOfWeek', required: false, enum: DayOfWeek, description: 'Filtrar por dia da semana especifico' })
  findByTeacherId(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Query() filters: FindTeacherAvailabilitiesDto,
  ) {
    return this.availabilitiesService.findByTeacherId(teacherId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de uma disponibilidade especifica.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.availabilitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os horarios de disponibilidade de um professor.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAvailabilityDto: UpdateAvailabilityDto) {
    return this.availabilitiesService.update(id, updateAvailabilityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um registro de disponibilidade.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.availabilitiesService.remove(id);
  }
}
