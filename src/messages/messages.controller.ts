import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req, ParseUUIDPipe } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createMessageDto: CreateMessageDto, @Req() req: any) {
    const senderId = req.user.id;
    return this.messagesService.create(createMessageDto, senderId);
  }

  @Get('conversation/:otherUserId') 
  findConversation(
    @Param('otherUserId', ParseUUIDPipe) otherUserId: string,
    @Req() req: any,
  ) {
    const loggedInUserId = req.user.id;
    return this.messagesService.findConversation(loggedInUserId, otherUserId);
  }

  @Get('class/:classId')
  findClassMessages(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.messagesService.findClassMessages(classId, requestingUserId);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.messagesService.remove(id, requestingUserId);
  }
}
