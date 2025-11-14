import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode, HttpStatus, ParseUUIDPipe, Query, UseInterceptors, UploadedFiles, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiConsumes, ApiParam, ApiQuery, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiBody, ApiBadRequestResponse, ApiNotFoundResponse, ApiForbiddenResponse, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VideoLessonsService } from './video-lessons.service';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { CreateVideoLessonUploadDto } from './dto/create-video-lesson-upload.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';
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

  @Post('classes/:classId/video-lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Cria uma nova video-aula e retorna URL de upload pré-assinada.',
    description: 'Cria o registro da video-aula no banco de dados e retorna uma URL para upload do arquivo de vídeo. O status inicial será "pending" até que o upload seja finalizado.',
  })
  @ApiParam({ name: 'classId', description: 'ID da turma', type: String, format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Video-aula criada com sucesso. Retorna URL de upload e metadados.',
    schema: {
      example: {
        id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        objectKey: 'video-aulas/3d5cf123-a0b12c3d-4e5f-6789-0123/9f77a123-4567-8901-2345-6789abcdef/video.mp4',
        uploadUrl: 'https://supabase.co/storage/v1/object/video-aulas/...',
        expiresInSeconds: 600,
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para criar video-aulas nesta turma' })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  createWithUploadUrl(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() createDto: CreateVideoLessonUploadDto,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const teacherId = req.user.id;
    return this.videoLessonsService.createWithUploadUrl(classId, createDto, teacherId);
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
        objectKey: 'video-aulas/.../video.mp4',
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

  @Get('classes/:classId/video-lessons/:id/stream-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtém URL pré-assinada para visualização do vídeo no modal.',
    description: 'Retorna uma URL pré-assinada temporária (válida por 10 minutos) para visualização do vídeo. Usado pelo frontend para exibir o vídeo no player.',
  })
  @ApiParam({ name: 'classId', description: 'ID da turma', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'URL pré-assinada gerada com sucesso',
    schema: {
      example: {
        url: 'https://supabase.co/storage/v1/object/sign/video-aulas/...?token=...',
        expiresInSeconds: 600,
        mimeType: 'video/mp4',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Video-aula ainda não está pronta para visualização (status não é "ready")' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem acesso ao conteúdo desta turma' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  getStreamUrl(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.getStreamUrl(classId, id, requestingUserId);
  }

  @Get('classes/:classId/video-lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Lista todas as videoaulas disponíveis para a turma informada.',
    description: 'Retorna todas as video-aulas da turma, ordenadas por data de criação (mais recentes primeiro).',
  })
  @ApiParam({ name: 'classId', description: 'ID da turma', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'Lista de video-aulas da turma',
    schema: {
      type: 'array',
      example: [
        {
          id: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
          title: 'Aula 03 — Introdução a Grafos',
          description: 'Conteúdo da semana 3',
          status: 'ready',
          visibility: 'class',
          mimeType: 'video/mp4',
          sizeBytes: 104857600,
          durationSeconds: 3600,
          createdAt: '2025-01-01T00:00:00.000Z',
          teacher: { id: '...', name: 'Professor Silva' },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem acesso ao conteúdo desta turma' })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  findAllByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.findAllByClass(classId, requestingUserId);
  }

  @Get('classes/:classId/video-lessons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtém detalhes de uma videoaula específica.' })
  @ApiParam({ name: 'classId', description: 'ID da turma', type: String, format: 'uuid' })
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
        mimeType: 'video/mp4',
        sizeBytes: 104857600,
        durationSeconds: 3600,
        attachmentUrls: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        teacher: { id: '...', name: 'Professor Silva' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem acesso ao conteúdo desta turma' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  findOneByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.findOne(id, requestingUserId);
  }

  @Patch('classes/:classId/video-lessons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualiza as informações de uma videoaula criada pelo usuário.' })
  @ApiParam({ name: 'classId', description: 'ID da turma', type: String, format: 'uuid' })
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
  updateByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
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

  @Delete('classes/:classId/video-lessons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Remove uma videoaula do acervo da turma.',
    description: 'Realiza soft delete da video-aula (marca como deletada, mas mantém os dados no banco).',
  })
  @ApiParam({ name: 'classId', description: 'ID da turma', type: String, format: 'uuid' })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Video-aula removida com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para remover esta video-aula' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  removeByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const requestingUserId = req.user.id;
    return this.videoLessonsService.remove(id, requestingUserId);
  }

  @Post(':id/attachments')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Faz upload de anexos para uma video-aula (múltiplos arquivos).',
    description: 'Faz upload de até 10 arquivos como anexos da video-aula. Os arquivos serão salvos em: video-aulas/{classId}/{videoLessonId}/{teacherId}/{uuid}-{nomeArquivo}.{ext}',
  })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiBody({
    description: 'Arquivos a serem enviados como anexos da video-aula (múltiplos arquivos)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Selecione múltiplos arquivos para upload (até 10 arquivos)',
        },
      },
      required: ['files'],
    },
  })
  @ApiOkResponse({
    description: 'Upload realizado com sucesso',
    schema: {
      example: {
        videoLessonId: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        uploaded: [
          {
            url: 'https://storage.../video-aulas/.../abc123-arquivo.pdf',
            name: 'arquivo.pdf',
          },
        ],
        attachmentUrls: ['https://storage.../video-aulas/.../abc123-arquivo.pdf'],
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Nenhum arquivo fornecido ou dados inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para adicionar anexos a esta video-aula' })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  uploadAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: MulterFile[],
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const teacherId = req.user.id;
    return this.videoLessonsService.uploadAttachments(id, teacherId, files);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Lista anexos de uma video-aula.' })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiOkResponse({
    description: 'Lista de anexos da video-aula',
    schema: {
      example: {
        videoLessonId: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        attachments: [
          {
            url: 'https://storage.../video-aulas/.../abc123-arquivo.pdf',
            name: 'arquivo.pdf',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Video-aula não encontrada' })
  listAttachments(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.videoLessonsService.listAttachments(id);
  }

  @Delete(':id/attachments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove um anexo de uma video-aula.' })
  @ApiParam({ name: 'id', description: 'ID da video-aula', type: String, format: 'uuid' })
  @ApiQuery({ name: 'url', description: 'URL completa do anexo a ser removido', type: String, required: true })
  @ApiOkResponse({
    description: 'Anexo removido com sucesso',
    schema: {
      example: {
        videoLessonId: 'a0b12c3d-4e5f-6789-0123-456789abcdef',
        removedUrl: 'https://storage.../video-aulas/.../abc123-arquivo.pdf',
        attachmentUrls: [],
      },
    },
  })
  @ApiBadRequestResponse({ description: 'URL do anexo não fornecida ou inválida' })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou não fornecido' })
  @ApiForbiddenResponse({ description: 'Usuário não tem permissão para remover anexos desta video-aula' })
  @ApiNotFoundResponse({ description: 'Video-aula ou anexo não encontrado' })
  removeAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('url') attachmentUrl: string,
    @Req() req: any,
  ) {
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('Usuário não autenticado. Token JWT necessário.');
    }
    const teacherId = req.user.id;
    return this.videoLessonsService.removeAttachment(id, attachmentUrl, teacherId);
  }

  // Endpoints legados - mantidos para compatibilidade
  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista todas as videoaulas disponíveis para a turma informada (legado).' })
  findAllByClassLegacy(
    @Param('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.videoLessonsService.findAllByClass(classId);
  }

  @Get('class/:classId/watches')
  @ApiOperation({ summary: 'Lista o status de visualização das vídeo-aulas da turma para um aluno.' })
  findWatchesByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.videoLessonsService.findWatchesByClass(classId, studentId);
  }

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
