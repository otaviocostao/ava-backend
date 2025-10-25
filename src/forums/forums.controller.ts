import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ForumsService } from './forums.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';

@ApiTags('Forums')
@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um fórum de discussão para uma turma.' })
  create(@Body() createForumDto: CreateForumDto) {
    return this.forumsService.create(createForumDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os fóruns disponíveis.' })
  findAll() {
    return this.forumsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um fórum específico pelo ID.' })
  findOne(@Param('id') id: string) {
    return this.forumsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza título ou descrição de um fórum.' })
  update(@Param('id') id: string, @Body() updateForumDto: UpdateForumDto) {
    return this.forumsService.update(id, updateForumDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um fórum do sistema.' })
  remove(@Param('id') id: string) {
    return this.forumsService.remove(id);
  }
}
