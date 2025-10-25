import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ForumPostsService } from './forum-posts.service';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';

@ApiTags('Forum Posts')
@Controller('forum-posts')
export class ForumPostsController {
  constructor(private readonly forumPostsService: ForumPostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo post ou resposta dentro de um fórum.' })
  create(@Body() createForumPostDto: CreateForumPostDto) {
    return this.forumPostsService.create(createForumPostDto);
  }

  @Get('forum/:forumId')
  @ApiOperation({ summary: 'Lista os tópicos de primeiro nível de um fórum, incluindo respostas.' })
  findAllByForum(@Param('forumId', ParseUUIDPipe) forumId: string) {
    return this.forumPostsService.findAllByForum(forumId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recupera os detalhes de um post específico.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.forumPostsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza o conteúdo de um post criado pelo usuário autenticado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateForumPostDto: UpdateForumPostDto,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.forumPostsService.update(id, updateForumPostDto, requestingUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um post se o usuário autenticado for o autor.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.forumPostsService.remove(id, requestingUserId);
  }
}
