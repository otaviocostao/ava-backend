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
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  findAll() {
    return this.classesService.findAll();
  }

  @Get('teacher/:teacherId')
  @ApiOperation({ summary: 'Lista todas as turmas vinculadas a um professor específico.' })
  findByTeacher(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.classesService.findByTeacher(teacherId);
  }

 
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.remove(id);
  }
}
