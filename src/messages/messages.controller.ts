import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MarkMessageReadDto } from './dto/mark-message-read.dto';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Envia uma mensagem privada ou para uma turma.' })
  create(@Body() createMessageDto: CreateMessageDto, @Req() req: any) {
    const senderId =
      req?.user?.id ??
      (req?.headers?.['x-user-id'] as string | undefined) ??
      (req?.query?.senderId as string | undefined);
    return this.messagesService.create(createMessageDto, senderId);
  }

  @Get('conversation/:otherUserId')
  @ApiOperation({ summary: 'Listar todas as mensagens trocadas entre o usuário autenticado e outro usuário.' })
  findConversation(
    @Param('otherUserId', ParseUUIDPipe) otherUserId: string,
    @Req() req: any,
  ) {
    const loggedInUserId =
      req?.user?.id ??
      (req?.headers?.['x-user-id'] as string | undefined) ??
      (req?.query?.senderId as string | undefined);
    return this.messagesService.findConversation(loggedInUserId, otherUserId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista as mensagens enviadas em um canal de turma.' })
  findClassMessages(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Req() req: any,
  ) {
    const requestingUserId =
      req?.user?.id ??
      (req?.headers?.['x-user-id'] as string | undefined) ??
      (req?.query?.senderId as string | undefined);
    return this.messagesService.findClassMessages(classId, requestingUserId);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Lista os resumos das conversas diretas (caixa de entrada) do usuário autenticado.' })
  findInbox(@Req() req: any): Promise<Array<{
    otherUser: { id: string; name: string; email: string };
    lastMessage: { id: string; content: string; sentAt: Date; isRead: boolean };
    unreadCount: number;
  }>> {
    const loggedInUserId =
      req?.user?.id ??
      (req?.headers?.['x-user-id'] as string | undefined) ??
      (req?.query?.senderId as string | undefined);
    return this.messagesService.getInboxSummaries(loggedInUserId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita ou revoga uma mensagem enviada pelo usuário autenticado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Req() req: any,
  ) {
    const requestingUserId =
      req?.user?.id ??
      (req?.headers?.['x-user-id'] as string | undefined) ??
      (req?.query?.senderId as string | undefined);
    return this.messagesService.update(id, updateMessageDto, requestingUserId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marca uma mensagem como lida e/ou arquivada para o usuário autenticado.' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markMessageReadDto: MarkMessageReadDto,
    @Req() req: any,
  ) {
    const requestingUserId =
      req?.user?.id ??
      (req?.headers?.['x-user-id'] as string | undefined) ??
      (req?.query?.senderId as string | undefined);
    return this.messagesService.markAsRead(id, requestingUserId, markMessageReadDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma mensagem enviada pelo usuário autenticado.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId =
      req?.user?.id ??
      (req?.headers?.['x-user-id'] as string | undefined) ??
      (req?.query?.senderId as string | undefined);
    return this.messagesService.remove(id, requestingUserId);
  }
}
