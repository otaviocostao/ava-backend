import { Module, Post } from '@nestjs/common';
import { ForumPostsService } from './forum-posts.service';
import { ForumPostsController } from './forum-posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumPost } from './entities/forum-post.entity';
import { User } from 'src/users/entities/user.entity';
import { Forum } from 'src/forums/entities/forum.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([ForumPost, User, Forum, Post]),
    ],
  controllers: [ForumPostsController],
  providers: [ForumPostsService],
})
export class ForumPostsModule {}
