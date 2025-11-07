import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário na plataforma.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os usuários cadastrados.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de um usuário específico.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza informações de um usuário.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um usuário do sistema.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Post(':userId/roles')
  @ApiOperation({ summary: 'Associa uma role/perfil a um usuário.' })
  associateRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.usersService.assignRoleToUser(userId, roleId);
  }

  @Delete(':userId/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove uma role específica de um usuário.' })
  removeRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.usersService.removeRoleFromUser(userId, roleId);
  }
  
  @Get(':studentId/gradebook')
  @ApiOperation({ summary: 'Lista o boletim com todas as notas do usuario (estudante).' })
  getStudentGradebook(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.usersService.getStudentGradebook(studentId);
  }
}
