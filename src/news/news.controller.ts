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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { NewsTargetType } from '../common/enums/news-target-type.enum';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

class FindNewsQueryDto {
  @IsOptional()
  @IsEnum(NewsTargetType)
  targetType?: NewsTargetType;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsUUID()
  publishedById?: string;
}

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publica uma nova notícia direcionada para toda a instituição ou públicos específicos.' })
  create(@Body() createNewsDto: CreateNewsDto) {
    return this.newsService.create(createNewsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista notícias filtrando por alvo ou autor.' })
  findAll(@Query() query: FindNewsQueryDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de uma notícia específica.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza o conteúdo ou público alvo de uma notícia.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNewsDto: UpdateNewsDto,
  ) {
    return this.newsService.update(id, updateNewsDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma notícia publicada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.remove(id);
  }
}
