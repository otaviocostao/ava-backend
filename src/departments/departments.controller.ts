import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpCode, HttpStatus, Put, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { SetCoordinatorDto } from './dto/set-coordinator.dto';
import { AddTeachersDto } from './dto/add-teachers.dto';
import { Department } from './entities/department.entity';
import { User } from 'src/users/entities/user.entity';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo departamento acadêmico.' })
  @ApiOkResponse({ description: 'Departamento criado com sucesso.', type: Department })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os departamentos. Opcionalmente filtra por coordenador.' })
  @ApiQuery({ name: 'coordinatorId', required: false, description: 'ID do coordenador para filtrar departamentos' })
  @ApiOkResponse({ description: 'Lista de departamentos.', type: [Department] })
  findAll(@Query('coordinatorId') coordinatorId?: string) {
    return this.departmentsService.findAll(coordinatorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um departamento específico pelo ID.' })
  @ApiOkResponse({ description: 'Departamento encontrado.', type: Department })
  @ApiNotFoundResponse({ description: 'Departamento não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza as informações de um departamento.' })
  @ApiOkResponse({ description: 'Departamento atualizado.', type: Department })
  @ApiNotFoundResponse({ description: 'Departamento não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto) 
    {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um departamento existente.' })
  @ApiNoContentResponse({ description: 'Departamento removido.' })
  @ApiNotFoundResponse({ description: 'Departamento não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.remove(id);
  }

  @Put(':id/coordinator')
  @ApiOperation({ summary: 'Define ou remove o coordenador de um departamento.' })
  @ApiOkResponse({ description: 'Coordenador atualizado no departamento.', type: Department })
  @ApiNotFoundResponse({ description: 'Departamento ou coordenador não encontrado.' })
  setCoordinator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() setCoordinatorDto: SetCoordinatorDto,
  ) {
    return this.departmentsService.setCoordinator(id, setCoordinatorDto);
  }

  @Get(':id/teachers')
  @ApiOperation({ summary: 'Lista todos os professores vinculados a um departamento.' })
  @ApiOkResponse({ description: 'Lista de professores do departamento.', type: [User] })
  @ApiNotFoundResponse({ description: 'Departamento não encontrado.' })
  getTeachers(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentsService.getTeachers(id);
  }

  @Post(':id/teachers')
  @ApiOperation({ summary: 'Adiciona um ou mais professores a um departamento. Valida que todos possuem role "teacher".' })
  @ApiOkResponse({ description: 'Departamento atualizado com novos professores.', type: Department })
  @ApiBadRequestResponse({ description: 'IDs inválidos ou usuário sem role teacher.' })
  @ApiConflictResponse({ description: 'Professor(es) já vinculado(s) ao departamento.' })
  @ApiNotFoundResponse({ description: 'Departamento ou usuário(s) não encontrado(s).' })
  addTeachers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addTeachersDto: AddTeachersDto,
  ) {
    return this.departmentsService.addTeachers(id, addTeachersDto);
  }

  @Delete(':id/teachers/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um professor de um departamento.' })
  @ApiNoContentResponse({ description: 'Professor removido do departamento.' })
  @ApiNotFoundResponse({ description: 'Departamento ou professor não encontrado.' })
  removeTeacher(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.departmentsService.removeTeacher(id, userId);
  }
}
