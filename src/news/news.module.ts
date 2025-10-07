import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NewsController } from './news.controller';
import { News } from './entities/news.entity';
import { NewsService } from './news.service';

@Module({
  imports: [TypeOrmModule.forFeature([News, User])],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
