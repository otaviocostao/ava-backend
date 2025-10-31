import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';
import { NoticeBoardService } from './notice-board.service';
import { NoticeBoardController } from './notice-board.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notice])],
  controllers: [NoticeBoardController],
  providers: [NoticeBoardService],
})
export class NoticeBoardModule {}
