import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoticeBoardService } from './notice-board.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { FindNoticesQueryDto } from './dto/find-notices.dto';
import { NoticeAudience } from 'src/common/enums/notice-audience.enum';

@ApiTags('Notice Board')
@Controller('notice-board')
export class NoticeBoardController {
  constructor(private readonly noticeBoardService: NoticeBoardService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo aviso no mural.' })
  create(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticeBoardService.create(createNoticeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os avisos cadastrados com filtros opcionais.' })
  findAll(@Query() query: FindNoticesQueryDto) {
    return this.noticeBoardService.findAll(query);
  }

  @Get('student')
  @ApiOperation({ summary: 'Lista avisos direcionados para alunos.' })
  findForStudents() {
    return this.noticeBoardService.findForAudience(NoticeAudience.STUDENT);
  }

  @Get('teacher')
  @ApiOperation({ summary: 'Lista avisos direcionados para professores.' })
  findForTeachers() {
    return this.noticeBoardService.findForAudience(NoticeAudience.TEACHER);
  }

  @Get('audience/:audience')
  @ApiOperation({ summary: 'Lista avisos filtrando pelo publico informado.' })
  findByAudience(
    @Param('audience', new ParseEnumPipe(NoticeAudience)) audience: NoticeAudience,
  ) {
    return this.noticeBoardService.findForAudience(audience);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um aviso especifico pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.noticeBoardService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um aviso existente.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    return this.noticeBoardService.update(id, updateNoticeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um aviso do mural.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.noticeBoardService.remove(id);
  }
}
