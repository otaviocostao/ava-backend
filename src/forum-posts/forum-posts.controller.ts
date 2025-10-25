import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseUUIDPipe, Req } from '@nestjs/common';
import { ForumPostsService } from './forum-posts.service';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';

@Controller('forum-posts')
export class ForumPostsController {
  constructor(private readonly forumPostsService: ForumPostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createForumPostDto: CreateForumPostDto) {
    return this.forumPostsService.create(createForumPostDto);
  }

  @Get('forum/:forumId')
  findAllByForum(@Param('forumId', ParseUUIDPipe) forumId: string) {
    return this.forumPostsService.findAllByForum(forumId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.forumPostsService.findOne(id);
  }

  @Patch(':id')
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
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.forumPostsService.remove(id, requestingUserId);
  }
}
