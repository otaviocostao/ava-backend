import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Message } from 'src/messages/entities/message.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, Class, Message, User])],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}


