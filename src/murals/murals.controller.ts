import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MuralsService } from './murals.service';
import { CreateMuralDto } from './dto/create-mural.dto';
import { UpdateMuralDto } from './dto/update-mural.dto';
import { MuralTargetRole } from './entities/mural.entity';

@ApiTags('Murals')
@Controller('murals')
export class MuralsController {
  constructor(private readonly muralsService: MuralsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo mural institucional.' })
  create(@Body() createMuralDto: CreateMuralDto, @UploadedFile() file: Express.Multer.File) {
    return this.muralsService.create(createMuralDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os murais institucionais.' })
  @ApiQuery({
    name: 'targetRole',
    required: false,
    enum: MuralTargetRole,
    description: 'Filtrar por papel de destino (aluno ou professor)',
  })
  findAll(@Query('targetRole') targetRole?: MuralTargetRole) {
    return this.muralsService.findAll(targetRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um mural institucional por ID.' })
  @ApiParam({ name: 'id', description: 'ID do mural', type: String })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.muralsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Atualiza um mural institucional.' })
  @ApiParam({ name: 'id', description: 'ID do mural', type: String })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMuralDto: UpdateMuralDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.muralsService.update(id, updateMuralDto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um mural institucional.' })
  @ApiParam({ name: 'id', description: 'ID do mural', type: String })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.muralsService.remove(id);
  }
}

