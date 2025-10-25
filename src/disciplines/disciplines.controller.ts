import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DisciplinesService } from './disciplines.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';

@ApiTags('Disciplines')
@Controller('disciplines')
export class DisciplinesController {
  constructor(private readonly disciplinesService: DisciplinesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova disciplina.' })
  create(@Body() createDisciplineDto: CreateDisciplineDto) {
    return this.disciplinesService.create(createDisciplineDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as disciplinas cadastradas.' })
  findAll() {
    return this.disciplinesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de uma disciplina pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma disciplina existente.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateDisciplineDto: UpdateDisciplineDto) {
    return this.disciplinesService.update(id, updateDisciplineDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma disciplina.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplinesService.remove(id);
  }
}
