import { Module } from '@nestjs/common';
import { ForumsService } from './forums.service';
import { ForumsController } from './forums.controller';
import { Forum } from './entities/forum.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from 'src/classes/entities/class.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Forum, Class]),
    ],
  controllers: [ForumsController],
  providers: [ForumsService],
})
export class ForumsModule {}
