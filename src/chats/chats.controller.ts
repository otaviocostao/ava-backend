import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { IsNotEmpty, IsString } from 'class-validator';

class SendMessageBody {
  @IsString()
  @IsNotEmpty()
  content: string;
}

@ApiTags('Chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get('students/:studentId/threads')
  @ApiOperation({ summary: 'Lista as conversas do aluno por turma (threads).' })
  getThreads(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Req() req: any,
  ) {
    const requestingUserId = req?.user?.id ?? studentId;
    return this.chatsService.getThreadsForStudent(studentId, requestingUserId);
  }

  @Get('students/:studentId/classes/:classId/messages')
  @ApiOperation({ summary: 'Lista as mensagens de uma turma para o aluno autenticado.' })
  getClassMessages(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Req() req: any,
  ) {
    const requestingUserId = req?.user?.id ?? studentId;
    return this.chatsService.getClassMessagesForStudent(studentId, classId, requestingUserId);
  }

  @Post('students/:studentId/classes/:classId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Envia uma mensagem em uma turma em nome do aluno autenticado.' })
  sendClassMessage(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() body: SendMessageBody,
    @Req() req: any,
  ) {
    const requestingUserId = req?.user?.id ?? studentId;
    return this.chatsService.sendClassMessageAsStudent(studentId, classId, body?.content, requestingUserId);
  }
}


