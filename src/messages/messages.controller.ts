import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Envia uma mensagem privada ou para uma turma.' })
  create(@Body() createMessageDto: CreateMessageDto, @Req() req: any) {
    const senderId = req.user.id;
    return this.messagesService.create(createMessageDto, senderId);
  }

  @Get('conversation/:otherUserId') 
  @ApiOperation({ summary: 'Listar todas as mensagens trocadas entre o usuário autenticado e outro usuário.' })
  findConversation(
    @Param('otherUserId', ParseUUIDPipe) otherUserId: string,
    @Req() req: any,
  ) {
    const loggedInUserId = req.user.id;
    return this.messagesService.findConversation(loggedInUserId, otherUserId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista as mensagens enviadas em um canal de turma.' })
  findClassMessages(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.messagesService.findClassMessages(classId, requestingUserId);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma mensagem enviada pelo usuário autenticado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.messagesService.remove(id, requestingUserId);
  }
}
