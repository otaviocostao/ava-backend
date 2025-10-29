import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

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

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de uma disponibilidade específica.' })
  findOne(@Param('id') id: string) {
    return this.availabilitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os horários de disponibilidade de um professor.' })
  update(@Param('id') id: string, @Body() updateAvailabilityDto: UpdateAvailabilityDto) {
    return this.availabilitiesService.update(id, updateAvailabilityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um registro de disponibilidade.' })
  remove(@Param('id') id: string) {
    return this.availabilitiesService.remove(id);
  }

  @Get('teachers/:teacherId/availabilities')
  @ApiOperation({ summary: 'Lista todas as disponibilidades de um professor específico.' })
  @ApiQuery({ name: 'semester', required: false, description: 'Filtrar por semestre específico' })
  @ApiQuery({ name: 'dayOfWeek', required: false, enum: DayOfWeek, description: 'Filtrar por dia da semana específico' })
  findByTeacherId(
    @Param('teacherId') teacherId: string,
    @Query('semester') semester?: string,
    @Query('dayOfWeek') dayOfWeek?: DayOfWeek,
  ) {
    const filters = { semester, dayOfWeek };
    return this.availabilitiesService.findByTeacherId(teacherId, filters);
  }
}
