import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { FindActivitiesQueryDto } from './dto/find-activities-query.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';
import type { MulterFile } from 'src/common/types/multer.types';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // ========== CRUD BÁSICO DE ATIVIDADES ==========
  @Post()
  @ApiTags('Activities - CRUD')
  @ApiOperation({ summary: 'Cria uma nova atividade acadêmica.' })
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  @ApiTags('Activities - CRUD')
  @ApiOperation({ summary: 'Lista todas as atividades cadastradas, com filtros opcionais.' })
  findAll(@Query() query: FindActivitiesQueryDto) {
    return this.activitiesService.findAllWithFilters(query);
  }

  @Get(':id')
  @ApiTags('Activities - CRUD')
  @ApiOperation({ summary: 'Recupera os detalhes de uma atividade específica.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiTags('Activities - CRUD')
  @ApiOperation({ summary: 'Atualiza parcialmente uma atividade existente.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @ApiTags('Activities - CRUD')
  @ApiOperation({ summary: 'Remove uma atividade do sistema.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.remove(id);
  }

  // ========== FILTROS E BUSCAS ==========
  @Get('students/:studentId')
  @ApiTags('Activities - Filtros')
  @ApiOperation({ summary: 'Lista todas as atividades do aluno filtradas por studentId.' })
  findByStudentId(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.activitiesService.findActivitiesByStudent(studentId);
  }

  @Get('class/:classId')
  @ApiTags('Activities - Filtros')
  @ApiOperation({ summary: 'Lista todas as atividades de uma turma específica.' })
  findByClassId(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.activitiesService.findByClassId(classId);
  }

  @Get('students/:studentId/submissions')
  @ApiTags('Activities - Filtros')
  @ApiOperation({ summary: 'Lista todas as submissões de um aluno específico.' })
  findSubmissionsByStudentId(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.activitiesService.findSubmissionsByStudentId(studentId);
  }

  // ========== CONCLUSÃO DE ATIVIDADES ==========
  @Post(':id/complete')
  @ApiTags('Activities - Conclusão')
  @ApiOperation({ summary: 'Marca uma atividade como concluída para um estudante.' })
  completeActivity(
    @Param('id', ParseUUIDPipe) activityId: string,
    @Body() completeActivityDto: CompleteActivityDto,
    @Query('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.activitiesService.completeActivity(activityId, studentId);
  }


  // ========== ANEXOS DO PROFESSOR ==========
  @Post(':activityId/attachments')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiTags('Activities - Anexos (Professor)')
  @ApiOperation({
    summary: 'Faz upload de anexos do professor para uma atividade (múltiplos arquivos).',
    description:
      'O classId é obtido automaticamente através da relação da atividade com a classe. Os arquivos serão salvos no path: activities/{classId}/{activityId}/{teacherId}/{arquivo}. Aceita até 10 arquivos por requisição.',
  })
  @ApiParam({ name: 'activityId', description: 'ID da atividade (o classId é obtido automaticamente através da relação)', type: String })
  @ApiQuery({ name: 'teacherId', description: 'ID do professor', type: String })
  @ApiBody({
    description: 'Arquivos a serem enviados como anexos da atividade (múltiplos arquivos)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Selecione múltiplos arquivos para upload (até 10 arquivos)',
        },
      },
      required: ['files'],
    },
  })
  uploadAttachment(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @UploadedFiles() files: MulterFile[],
    @Query('teacherId', ParseUUIDPipe) teacherId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo fornecido.');
    }
    return this.activitiesService.uploadActivityAttachments(activityId, teacherId, files);
  }

  @Get(':activityId/attachments')
  @ApiTags('Activities - Anexos (Professor)')
  @ApiOperation({ summary: 'Lista todos os anexos de uma atividade específica.' })
  @ApiParam({ name: 'activityId', description: 'ID da atividade', type: String })
  getAttachments(@Param('activityId', ParseUUIDPipe) activityId: string) {
    return this.activitiesService.getActivityAttachments(activityId);
  }

  @Get(':activityId/attachments/download')
  @ApiTags('Activities - Anexos (Professor)')
  @ApiOperation({ summary: 'Faz download de um anexo específico de uma atividade.' })
  @ApiParam({ name: 'activityId', description: 'ID da atividade', type: String })
  @ApiQuery({ name: 'attachmentUrl', description: 'URL do anexo a ser baixado', type: String })
  @Header('Content-Type', 'application/octet-stream')
  async downloadAttachment(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Query('attachmentUrl') attachmentUrl: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.activitiesService.downloadActivityAttachment(
      activityId,
      attachmentUrl,
    );

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Delete(':activityId/attachments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiTags('Activities - Anexos (Professor)')
  @ApiOperation({ summary: 'Remove um anexo do professor de uma atividade.' })
  @ApiParam({ name: 'activityId', description: 'ID da atividade', type: String })
  @ApiQuery({ name: 'teacherId', description: 'ID do professor', type: String })
  @ApiQuery({ name: 'attachmentUrl', description: 'URL do anexo a ser removido', type: String })
  removeAttachment(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Query('teacherId', ParseUUIDPipe) teacherId: string,
    @Query('attachmentUrl') attachmentUrl: string,
  ) {
    return this.activitiesService.removeActivityAttachment(activityId, teacherId, attachmentUrl);
  }

  // ========== SUBMISSÕES DE ATIVIDADES ==========
  @Post('students/:studentId/activities/:activityId/submissions/upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiTags('Activities - Submissões')
  @ApiOperation({
    summary: 'Faz upload de submissões de atividade do aluno (múltiplos arquivos) e marca como concluída.',
    description:
      'O classId é obtido automaticamente através da relação da atividade com a classe. Os arquivos serão salvos no path: activities/{classId}/{activityId}/{studentId}/{arquivo}. Aceita até 10 arquivos por requisição. A atividade é automaticamente marcada como concluída após o upload.',
  })
  @ApiParam({ name: 'studentId', description: 'ID do aluno', type: String })
  @ApiParam({ name: 'activityId', description: 'ID da atividade (o classId é obtido automaticamente através da relação)', type: String })
  @ApiBody({
    description: 'Arquivos da submissão da atividade (múltiplos arquivos permitidos)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Selecione múltiplos arquivos para upload (até 10 arquivos)',
        },
      },
      required: ['files'],
    },
  })
  uploadSubmission(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @UploadedFiles() files: MulterFile[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo fornecido.');
    }
    return this.activitiesService.uploadActivitySubmissions(activityId, studentId, files);
  }

  @Delete('submissions/:submissionId/files')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Activities - Submissões')
  @ApiOperation({
    summary: 'Remove um arquivo específico de uma submissão.',
    description:
      'Remove apenas um arquivo da submissão. Se for o último arquivo, a submissão é resetada para PENDING.',
  })
  @ApiParam({ name: 'submissionId', description: 'ID da submissão', type: String })
  @ApiQuery({ name: 'fileUrl', description: 'URL do arquivo a ser removido', type: String })
  @ApiQuery({ name: 'studentId', description: 'ID do aluno (para validação de permissão)', type: String })
  removeSubmissionFile(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Query('fileUrl') fileUrl: string,
    @Query('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.activitiesService.removeSubmissionFile(submissionId, fileUrl, studentId);
  }

  @Delete('students/:studentId/activities/:activityId/submissions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiTags('Activities - Submissões')
  @ApiOperation({ summary: 'Remove a submissão completa de um aluno (todos os arquivos e registro).' })
  @ApiParam({ name: 'studentId', description: 'ID do aluno', type: String })
  @ApiParam({ name: 'activityId', description: 'ID da atividade', type: String })
  removeSubmission(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
  ) {
    return this.activitiesService.removeActivitySubmission(activityId, studentId);
  }

  @Get(':activityId/submissions')
  @ApiTags('Activities - Submissões')
  @ApiOperation({ summary: 'Lista todas as submissões de uma atividade específica.' })
  findSubmissionsByActivityId(@Param('activityId', ParseUUIDPipe) activityId: string) {
    return this.activitiesService.findSubmissionsByActivityId(activityId);
  }

  @Get(':activityId/submissions/students/:studentId')
  @ApiTags('Activities - Submissões')
  @ApiOperation({ summary: 'Busca a submissão de um aluno específico para uma atividade.' })
  findSubmissionByActivityAndStudent(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.activitiesService.findSubmissionByActivityAndStudent(activityId, studentId);
  }

  @Get('submissions/:submissionId')
  @ApiTags('Activities - Submissões')
  @ApiOperation({ summary: 'Recupera os detalhes de uma submissão específica pelo ID.' })
  findSubmissionById(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.activitiesService.findSubmissionById(submissionId);
  }


  // ========== ANEXOS PARA ALUNOS ==========
  @Get('students/:studentId/activities/:activityId/attachments')
  @ApiTags('Activities - Anexos (Aluno)')
  @ApiOperation({ summary: 'Lista todos os anexos de uma atividade (endpoint para alunos).' })
  @ApiParam({ name: 'studentId', description: 'ID do aluno', type: String })
  @ApiParam({ name: 'activityId', description: 'ID da atividade', type: String })
  getAttachmentsForStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
  ) {
    return this.activitiesService.getActivityAttachmentsForStudent(activityId, studentId);
  }

  @Get('students/:studentId/activities/:activityId/attachments/download')
  @ApiTags('Activities - Anexos (Aluno)')
  @ApiOperation({ summary: 'Faz download de um anexo específico de uma atividade (endpoint para alunos).' })
  @ApiParam({ name: 'studentId', description: 'ID do aluno', type: String })
  @ApiParam({ name: 'activityId', description: 'ID da atividade', type: String })
  @ApiQuery({ name: 'attachmentUrl', description: 'URL do anexo a ser baixado', type: String })
  @Header('Content-Type', 'application/octet-stream')
  async downloadAttachmentForStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Query('attachmentUrl') attachmentUrl: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.activitiesService.downloadActivityAttachmentForStudent(
      activityId,
      studentId,
      attachmentUrl,
    );

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  // ========== ARQUIVOS DE SUBMISSÕES ==========
  @Get(':activityId/submissions/files')
  @ApiTags('Activities - Arquivos de Submissões')
  @ApiOperation({
    summary: 'Lista todos os arquivos de todas as submissões de uma atividade específica.',
    description:
      'Retorna todos os arquivos (fileUrls) de todas as submissões da atividade, organizados por aluno. Útil para download em lote.',
  })
  @ApiParam({ name: 'activityId', description: 'ID da atividade', type: String })
  getAllSubmissionFiles(@Param('activityId', ParseUUIDPipe) activityId: string) {
    return this.activitiesService.getAllSubmissionFiles(activityId);
  }

  @Get('submissions/:submissionId/files')
  @ApiTags('Activities - Arquivos de Submissões')
  @ApiOperation({ summary: 'Lista todos os arquivos de uma submissão específica.' })
  @ApiParam({ name: 'submissionId', description: 'ID da submissão', type: String })
  getSubmissionFiles(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.activitiesService.getSubmissionFiles(submissionId);
  }

  @Get('submissions/:submissionId/files/detailed')
  @ApiTags('Activities - Arquivos de Submissões')
  @ApiOperation({
    summary: 'Retorna informações detalhadas dos arquivos de uma submissão.',
    description:
      'Retorna informações completas de cada arquivo incluindo nome original, URL e nome do arquivo salvo. Útil para exibir no frontend com nomes amigáveis.',
  })
  @ApiParam({ name: 'submissionId', description: 'ID da submissão', type: String })
  getSubmissionFilesDetailed(@Param('submissionId', ParseUUIDPipe) submissionId: string) {
    return this.activitiesService.getSubmissionFilesDetailed(submissionId);
  }

  @Get('submissions/:submissionId/files/download')
  @ApiTags('Activities - Arquivos de Submissões')
  @ApiOperation({ summary: 'Faz download de um arquivo específico de uma submissão.' })
  @ApiParam({ name: 'submissionId', description: 'ID da submissão', type: String })
  @ApiQuery({ name: 'fileUrl', description: 'URL do arquivo a ser baixado', type: String })
  @Header('Content-Type', 'application/octet-stream')
  async downloadSubmissionFile(
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Query('fileUrl') fileUrl: string,
    @Res() res: Response,
  ) {
    try {
      const { buffer, fileName } = await this.activitiesService.downloadSubmissionFile(
        submissionId,
        fileUrl,
      );

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      // Se já é uma exceção HTTP, deixa o NestJS tratar
      throw error;
    }
  }
}
