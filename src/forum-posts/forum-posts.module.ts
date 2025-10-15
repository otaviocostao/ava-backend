import { Module } from '@nestjs/common';
import { ForumPostsService } from './forum-posts.service';
import { ForumPostsController } from './forum-posts.controller';

@Module({
  controllers: [ForumPostsController],
  providers: [ForumPostsService],
})
export class ForumPostsModule {}
