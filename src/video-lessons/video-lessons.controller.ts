import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode, HttpStatus, ParseUUIDPipe, Query, UseGuards, UnauthorizedException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiBearerAuth, ApiUnauthorizedResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoLessonsService } from './video-lessons.service';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { CreateVideoLessonUploadDto } from './dto/create-video-lesson-upload.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';
import { UpdateVideoLessonOrderDto } from './dto/update-video-lesson-order.dto';
import { FinalizeVideoLessonDto } from './dto/finalize-video-lesson.dto';
import { MarkVideoWatchedDto } from './dto/mark-video-watched.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import type { MulterFile } from 'src/common/types/multer.types';

@ApiTags('Video Lessons')
@Controller('video-lessons')
export class VideoLessonsController {
  constructor(private readonly videoLessonsService: VideoLessonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publica uma nova videoaula em uma turma.' })
  create(@Body() createVideoLessonDto: CreateVideoLessonDto, @Req() req: any) {
    const uploaderId = req.user.id;
    return this.videoLessonsService.create(createVideoLessonDto, uploaderId);
  }

  @Post('disciplines/:disciplineId/video-lessons')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Cria uma nova video-aula; se enviado arquivo, o upload é feito no mesmo POST.',
    description: 'Com arquivo: cria e envia o vídeo. Sem arquivo: retorna URL de upload e metadados.',
  })
  @ApiParam({ name: 'disciplineId', description: 'ID da disciplina', type: String, format: 'uuid' })
  @ApiBody({
    description: 'Metadados da video-aula e arquivo opcional (file).',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title'],
    },
  })
  @ApiCreatedResponse({
    description: 'Video-aula criada com sucesso. Com arquivo: upload concluído; Sem arquivo: retorna uploadUrl.',
    schema: {
      example: {
        id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        objectKey: 'video-aulas/3d5cf123-a0b12c3d-4e5f-6789-0123/a0b12c3d-4e5f-6789-0123-456789abcdef',
        fileUrl: 'https://.../storage/v1/object/public/video-aulas/disciplineId/videoLessonId',
        uploadUrl: undefined,
        expiresInSeconds: undefined,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para criar video-aulas nesta turma' })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  createWithUploadUrl(
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Body() createDto: CreateVideoLessonUploadDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const teacherId = req.user.id;
    if (file) {
      return this.videoLessonsService.createWithFile(disciplineId, createDto, teacherId, file);
    }
    return this.videoLessonsService.createWithUploadUrl(disciplineId, createDto, teacherId);
  }

  @Post(':id/finalize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Finaliza o upload e marca a video-aula como pronta.',
    description: 'Marca o status da video-aula como "ready", permitindo que alunos e professores visualizem o vídeo.',
  })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'Upload finalizado com sucesso. Video-aula agora está disponível para visualização.',
    schema: {
      example: {
        id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        title: 'Aula 03 — Introdução a Grafos',
        status: 'ready',
        objectKey: 'video-aulas/<disciplineId>/<videoLessonId>',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Video-aula já está finalizada ou não está no status "pending"' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para finalizar este upload' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  finalizeUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() finalizeDto: FinalizeVideoLessonDto,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const teacherId = req.user.id;
    return this.videoLessonsService.finalizeUpload(id, teacherId);
  }

  @Post(':id/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Faz upload do arquivo de vídeo para a video-aula.',
    description: 'Envia um único arquivo de vídeo para o caminho: video-aulas/{disciplineId}/{videoLessonId}.',
  })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiBody({
    description: 'Arquivo de vídeo',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({
    description: 'Upload realizado com sucesso',
    schema: {
      example: {
        id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        objectKey: 'video-aulas/<disciplineId>/<videoLessonId>',
        fileUrl: 'https://.../storage/v1/object/public/video-aulas/<disciplineId>/<videoLessonId>',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Nenhum arquivo enviado ou estado inválido' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para enviar este vídeo' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  uploadVideo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const teacherId = req.user.id;
    return this.videoLessonsService.uploadVideoFile(id, teacherId, file);
  }

  @Get('disciplines/:disciplineId/video-lessons/:id/stream-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtém URL pré-assinada para visualização do vídeo no modal.',
    description: 'Retorna uma URL pré-assinada temporária (válida por 10 minutos) para visualização do vídeo. Usado pelo frontend para exibir o vídeo no player.',
  })
  @ApiParam({ name: 'disciplineId', description: 'ID da disciplina', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'URL pré-assinada gerada com sucesso',
    schema: {
      example: {
        url: 'https://supabase.co/storage/v1/object/sign/video-aulas/...?token=...',
        expiresInSeconds: 600,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Video-aula ainda não está pronta para visualização (status não é "ready")' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem acesso ao conteúdo desta turma' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  getStreamUrl(
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.getStreamUrl(disciplineId, id, requestingUserId);
  }

  @Get('disciplines/:disciplineId/video-lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Lista todas as videoaulas disponíveis para a disciplina informada.',
    description: 'Retorna todas as video-aulas da disciplina, ordenadas por data de criação (mais recentes primeiro).',
  })
  @ApiParam({ name: 'disciplineId', description: 'ID da disciplina', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'Lista de video-aulas da disciplina',
    schema: {
      type: 'array',
      example: [
        {
          id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
          title: 'Aula 03 — Introdução a Grafos',
          description: 'Conteúdo da semana 3',
          status: 'ready',
          visibility: 'class',
          durationSeconds: 3600,
          createdAt: '2025-01-01T00:00:00.000Z',
          uploadedBy: { id: '...', name: 'Professor Silva' },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem acesso ao conteúdo desta turma' })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  findAllByDiscipline(
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.findAllByDiscipline(disciplineId, requestingUserId);
  }

  @Get('disciplines/:disciplineId/video-lessons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtém detalhes de uma videoaula específica.' })
  @ApiParam({ name: 'disciplineId', description: 'ID da disciplina', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'Detalhes da video-aula',
    schema: {
      example: {
        id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        title: 'Aula 03 — Introdução a Grafos',
        description: 'Conteúdo da semana 3',
        status: 'ready',
        visibility: 'class',
        durationSeconds: 3600,
        createdAt: '2025-01-01T00:00:00.000Z',
        teacher: { id: '...', name: 'Professor Silva' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem acesso ao conteúdo desta turma' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  findOneByDiscipline(
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.findOne(id, requestingUserId);
  }

  @Patch('disciplines/:disciplineId/video-lessons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualiza as informações de uma videoaula criada pelo usuário.' })
  @ApiParam({ name: 'disciplineId', description: 'ID da disciplina', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'Video-aula atualizada com sucesso',
    schema: {
      example: {
        id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        title: 'Aula 03 — Introdução a Grafos (Atualizada)',
        description: 'Conteúdo atualizado',
        visibility: 'class',
        durationSeconds: 3800,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para editar esta video-aula' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  updateByDiscipline(
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVideoLessonDto: UpdateVideoLessonDto,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.update(
      id,
      updateVideoLessonDto,
      requestingUserId,
    );
  }

  @Patch('disciplines/:disciplineId/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Reordena as vídeo-aulas de uma disciplina.',
    description: 'Atualiza a ordem de múltiplas vídeo-aulas em uma disciplina. A ordem deve ser única dentro da disciplina.',
  })
  @ApiParam({ name: 'disciplineId', description: 'ID da disciplina', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'Ordem atualizada com sucesso',
    schema: {
      example: [
        {
          id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
          title: 'Aula 01',
          order: 1,
        },
        {
          id: 'b1c23d4e-5f67-8901-2345-6789bcdef012',
          title: 'Aula 02',
          order: 2,
        },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou ordens duplicadas' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para reordenar vídeo-aulas nesta disciplina' })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  reorderVideoLessons(
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Body() updateOrderDto: UpdateVideoLessonOrderDto,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.updateVideoLessonsOrder(
      disciplineId,
      updateOrderDto,
      requestingUserId,
    );
  }

  @Delete('disciplines/:disciplineId/video-lessons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Remove uma videoaula do acervo da disciplina.',
    description: 'Realiza soft delete da video-aula (marca como deletada, mas mantém os dados no banco).',
  })
  @ApiParam({ name: 'disciplineId', description: 'ID da disciplina', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Video-aula removida com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para remover esta video-aula' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  removeByDiscipline(
    @Param('disciplineId', ParseUUIDPipe) disciplineId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.remove(id, requestingUserId);
  }

  // Endpoints de anexos removidos: a video-aula possui apenas um arquivo de vídeo principal.

  // Endpoints legados removidos (rota por turma substituída por rota por disciplina)

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de uma videoaula específica.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.videoLessonsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza as informações de uma videoaula criada pelo usuário.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVideoLessonDto: UpdateVideoLessonDto,
    @Req() req: any,
  ) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.update(
      id,
      updateVideoLessonDto,
      requestingUserId,
    );
  }

  @Patch(':id/watched')
  @ApiOperation({ summary: 'Marca vídeo como assistido por um estudante.' })
  markAsWatched(
    @Param('id', ParseUUIDPipe) videoLessonId: string,
    @Body() markVideoWatchedDto: MarkVideoWatchedDto,
    @Query('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.videoLessonsService.markAsWatched(
      videoLessonId,
      studentId,
      markVideoWatchedDto.watchedPercentage || 100,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma videoaula do acervo da turma.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const requestingUserId = req.user.id;
    return this.videoLessonsService.remove(id, requestingUserId);
  }
}
