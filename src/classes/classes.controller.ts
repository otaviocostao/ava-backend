import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';

@ApiTags('Classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria uma nova turma vinculando disciplina e, se informado, o docente responsável.' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as turmas cadastradas.' })
  findAll() {
    return this.classesService.findAll();
    
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Lista todas as turmas vinculadas a um professor específico.' })
  findByTeacher(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.classesService.findByTeacher(teacherId);
  }

 
  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes completos de uma turma pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de uma turma, inclusive disciplina e professor.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return this.classesService.update(id, updateClassDto);
  }

  @Post(':id/teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atribui ou altera o docente responsável por uma turma.' })
  @ApiBody({
    type: AssignTeacherDto,
    description: 'Payload contendo o identificador do professor que será responsável pela turma.',
  })
  assignTeacher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTeacherDto: AssignTeacherDto,
  ) {
    return this.classesService.assignTeacher(id, assignTeacherDto.teacherId);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma turma do sistema.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.remove(id);
  }
}
