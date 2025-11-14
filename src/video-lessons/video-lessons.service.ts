import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { CreateVideoLessonUploadDto } from './dto/create-video-lesson-upload.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';
import { VideoLesson } from './entities/video-lesson.entity';
import { VideoLessonWatch } from './entities/video-lesson-watch.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { User } from 'src/users/entities/user.entity';
import { StorageService } from 'src/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import type { MulterFile } from 'src/common/types/multer.types';

@Injectable()
export class VideoLessonsService {
  private readonly bucketName = 'video-aulas';
  private readonly presignedUrlExpiresIn = 600; // 10 minutos

  constructor(
    @InjectRepository(VideoLesson)
    private videoLessonRepository: Repository<VideoLesson>,
    @InjectRepository(VideoLessonWatch)
    private videoLessonWatchRepository: Repository<VideoLessonWatch>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Cria uma nova video-aula e retorna URL de upload pré-assinada
   */
  async createWithUploadUrl(
    classId: string,
    createDto: CreateVideoLessonUploadDto,
    teacherId: string,
  ): Promise<{
    id: string;
    objectKey: string;
    uploadUrl: string;
    expiresInSeconds: number;
  }> {
    const classInstance = await this.classRepository.findOne({
      where: { id: classId },
      relations: ['teacher'],
    });

    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    // Verificar se o usuário é professor da turma ou admin
    const isTeacher = classInstance.teacher?.id === teacherId;
    if (!isTeacher) {
      // Verificar se é admin (pode ser implementado com roles)
      throw new ForbiddenException('Você não tem permissão para adicionar vídeos a esta turma.');
    }

    // Gerar ID temporário para construir o objectKey
    // O ID real será gerado pelo banco, mas precisamos de um temporário para o objectKey
    const tempId = nanoid();
    
    // Construir object_key: video-aulas/{classId}/{videoLessonId}/{teacherId}/video.{ext}
    const fileName = `video.${createDto.fileExtension}`;
    const tempObjectKey = `${classId}/${tempId}/${teacherId}/${fileName}`;
    const tempFullObjectKey = `${this.bucketName}/${tempObjectKey}`;

    // Criar registro no banco com status 'pending' (o ID será gerado pelo banco)
    const newVideoLesson = this.videoLessonRepository.create({
      title: createDto.title,
      description: createDto.description,
      class: { id: classId },
      teacher: { id: teacherId },
      objectKey: tempFullObjectKey, // Temporário, será atualizado
      fileExtension: createDto.fileExtension,
      mimeType: createDto.mimeType,
      sizeBytes: createDto.sizeBytes,
      status: 'pending',
      visibility: 'class',
      attachmentUrls: [],
    });

    const savedVideoLesson = await this.videoLessonRepository.save(newVideoLesson);
    
    // Atualizar objectKey com o ID real gerado pelo banco
    const realObjectKey = `${classId}/${savedVideoLesson.id}/${teacherId}/${fileName}`;
    const realFullObjectKey = `${this.bucketName}/${realObjectKey}`;
    savedVideoLesson.objectKey = realFullObjectKey;
    await this.videoLessonRepository.save(savedVideoLesson);

    // Gerar URL de upload (nota: Supabase não tem presigned URLs para upload como S3)
    // Retornamos a URL da API REST que será usada pelo backend para fazer upload
    const uploadUrl = await this.storageService.createPresignedUploadUrl(
      this.bucketName,
      realObjectKey,
      this.presignedUrlExpiresIn,
      createDto.mimeType,
    );

    return {
      id: savedVideoLesson.id,
      objectKey: realFullObjectKey,
      uploadUrl,
      expiresInSeconds: this.presignedUrlExpiresIn,
    };
  }

  /**
   * Finaliza o upload e marca a video-aula como 'ready'
   */
  async finalizeUpload(videoLessonId: string, teacherId: string): Promise<VideoLesson> {
    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id: videoLessonId },
      relations: ['teacher', 'class', 'uploadedBy'],
    });

    if (!videoLesson) {
      throw new NotFoundException(`Video-aula com ID "${videoLessonId}" não encontrada.`);
    }

    // Verificar permissão: usar teacher se disponível, senão usar uploadedBy (legado)
    const ownerId = videoLesson.teacher?.id || videoLesson.uploadedBy?.id;
    if (!ownerId) {
      throw new BadRequestException('Video-aula não possui professor associado.');
    }

    if (ownerId !== teacherId) {
      throw new ForbiddenException('Você não tem permissão para finalizar este upload.');
    }

    if (videoLesson.status !== 'pending') {
      throw new BadRequestException(`Video-aula já está com status "${videoLesson.status}".`);
    }

    videoLesson.status = 'ready';
    return this.videoLessonRepository.save(videoLesson);
  }

  /**
   * Obtém URL pré-assinada para visualização do vídeo
   */
  async getStreamUrl(
    classId: string,
    videoLessonId: string,
    requestingUserId: string,
  ): Promise<{
    url: string;
    expiresInSeconds: number;
    mimeType: string;
  }> {
    // Verificar permissão de acesso
    await this.ensureUserCanViewClassContent(classId, requestingUserId);

    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id: videoLessonId, class: { id: classId } },
    });

    if (!videoLesson) {
      throw new NotFoundException(`Video-aula com ID "${videoLessonId}" não encontrada.`);
    }

    if (videoLesson.status !== 'ready') {
      throw new BadRequestException(`Video-aula ainda não está pronta para visualização (status: ${videoLesson.status}).`);
    }

    // Extrair path do objectKey (remover nome do bucket)
    const path = videoLesson.objectKey.replace(`${this.bucketName}/`, '');

    // Gerar URL pré-assinada para download/visualização
    const streamUrl = await this.storageService.createPresignedDownloadUrl(
      this.bucketName,
      path,
      this.presignedUrlExpiresIn,
      false, // inline, não forçar download
    );

    return {
      url: streamUrl,
      expiresInSeconds: this.presignedUrlExpiresIn,
      mimeType: videoLesson.mimeType || 'video/mp4',
    };
  }

  /**
   * Método legado - mantido para compatibilidade
   */
  async create(
    createVideoLessonDto: CreateVideoLessonDto,
    uploaderId: string,
  ): Promise<VideoLesson> {
    const { classId, title, videoUrl, duration } = createVideoLessonDto;

    const classInstance = await this.classRepository.findOne({
      where: { id: classId },
      relations: ['teacher'],
    });

    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    if (classInstance.teacher?.id !== uploaderId) {
      throw new ForbiddenException('Você não tem permissão para adicionar vídeos a esta turma.');
    }

    // Método legado - criar com campos antigos se disponíveis
    const newVideoLesson = this.videoLessonRepository.create({
      title,
      videoUrl: videoUrl || null,
      durationSeconds: duration ? duration * 60 : null, // Converter minutos para segundos
      class: { id: classId },
      teacher: { id: uploaderId },
      objectKey: videoUrl ? `legacy-${nanoid()}` : `${this.bucketName}/${classId}/${nanoid()}/${uploaderId}/video.mp4`,
      status: 'ready',
      visibility: 'class',
      attachmentUrls: [],
    });

    return this.videoLessonRepository.save(newVideoLesson);
  }

  async findAllByClass(classId: string, requestingUserId?: string): Promise<VideoLesson[]> {
    if (requestingUserId) {
      await this.ensureUserCanViewClassContent(classId, requestingUserId);
    }

    return this.videoLessonRepository.find({
      where: { 
        class: { id: classId },
        deletedAt: IsNull(), // Soft delete
      },
      relations: ['teacher', 'class'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, requestingUserId?: string): Promise<VideoLesson> {
    const videoLesson = await this.videoLessonRepository.findOne({
      where: { 
        id,
        deletedAt: IsNull(), // Soft delete
      },
      relations: ['class', 'teacher'],
    });

    if (!videoLesson) {
      throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    if (requestingUserId) {
      await this.ensureUserCanViewClassContent(videoLesson.class.id, requestingUserId);
    }

    return videoLesson;
  }

  async findWatchesByClass(classId: string, studentId: string) {
    await this.ensureUserCanViewClassContent(classId, studentId);
    const watches = await this.videoLessonWatchRepository.find({
      where: { student: { id: studentId } },
      relations: ['videoLesson', 'videoLesson.class'],
      order: { watchedAt: 'DESC' },
    });
    return watches
      .filter(w => w.videoLesson?.class?.id === classId)
      .map(w => ({
        videoLessonId: w.videoLesson.id,
        watchedPercentage: Number(w.watchedPercentage),
        watchedAt: w.watchedAt,
      }));
  }

  async update(
    id: string,
    updateVideoLessonDto: UpdateVideoLessonDto,
    requestingUserId: string,
  ): Promise<VideoLesson> {
    const videoLesson = await this.videoLessonRepository.findOne({
        where: { 
          id,
          deletedAt: IsNull(), // Soft delete
        },
        relations: ['teacher', 'class', 'uploadedBy'],
    });
    
    if (!videoLesson) {
        throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    // Verificar se é professor da turma ou admin: usar teacher se disponível, senão usar uploadedBy (legado)
    const ownerId = videoLesson.teacher?.id || videoLesson.uploadedBy?.id;
    if (!ownerId || ownerId !== requestingUserId) {
      throw new ForbiddenException('Você não tem permissão para editar este recurso.');
    }

    // Atualizar apenas campos permitidos
    if (updateVideoLessonDto.title !== undefined) {
      videoLesson.title = updateVideoLessonDto.title;
    }
    if (updateVideoLessonDto.description !== undefined) {
      videoLesson.description = updateVideoLessonDto.description;
    }
    if (updateVideoLessonDto.visibility !== undefined) {
      videoLesson.visibility = updateVideoLessonDto.visibility;
    }
    if (updateVideoLessonDto.durationSeconds !== undefined) {
      videoLesson.durationSeconds = updateVideoLessonDto.durationSeconds;
    }

    return this.videoLessonRepository.save(videoLesson);
  }

  async remove(id: string, requestingUserId: string): Promise<void> {
    const videoLesson = await this.videoLessonRepository.findOne({
        where: { 
          id,
          deletedAt: IsNull(), // Soft delete
        },
        relations: ['teacher', 'class', 'uploadedBy'],
    });

    if (!videoLesson) {
        throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    // Verificar se é professor da turma ou admin: usar teacher se disponível, senão usar uploadedBy (legado)
    const ownerId = videoLesson.teacher?.id || videoLesson.uploadedBy?.id;
    if (!ownerId || ownerId !== requestingUserId) {
      throw new ForbiddenException('Você não tem permissão para remover este recurso.');
    }

    // Soft delete
    videoLesson.deletedAt = new Date();
    await this.videoLessonRepository.save(videoLesson);

    // Opcional: remover arquivo do storage
    try {
      const path = videoLesson.objectKey.replace(`${this.bucketName}/`, '');
      await this.storageService.deleteFileFrom(this.bucketName, path);
    } catch (error) {
      // Ignora erros ao remover arquivo do storage
      console.error('Erro ao remover arquivo do storage:', error);
    }
  }

  async markAsWatched(
    videoLessonId: string,
    studentId: string,
    watchedPercentage: number = 100,
  ): Promise<VideoLessonWatch> {
    const [videoLesson, student] = await Promise.all([
      this.videoLessonRepository.findOne({ where: { id: videoLessonId } }),
      this.userRepository.findOne({ where: { id: studentId } }),
    ]);

    if (!videoLesson) {
      throw new NotFoundException(`Videoaula com ID "${videoLessonId}" não encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" não encontrado.`);
    }

    await this.ensureUserCanViewClassContent(videoLesson.class.id, studentId);

    const clampedPercentage = Math.max(0, Math.min(100, watchedPercentage));

    const existingWatch = await this.videoLessonWatchRepository.findOne({
      where: { videoLesson: { id: videoLessonId }, student: { id: studentId } },
    });

    if (existingWatch) {
      existingWatch.watchedPercentage = clampedPercentage;
      existingWatch.watchedAt = new Date();
      return this.videoLessonWatchRepository.save(existingWatch);
    }

    const watch = this.videoLessonWatchRepository.create({
      videoLesson,
      student,
      watchedPercentage: clampedPercentage,
    });

    return this.videoLessonWatchRepository.save(watch);
  }

  /**
   * Upload de anexos para uma video-aula
   */
  async uploadAttachments(
    videoLessonId: string,
    teacherId: string,
    files: MulterFile[],
  ): Promise<{
    videoLessonId: string;
    uploaded: { url: string; name: string }[];
    attachmentUrls: string[];
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo fornecido.');
    }

    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id: videoLessonId },
      relations: ['class', 'teacher', 'uploadedBy'],
    });

    if (!videoLesson) {
      throw new NotFoundException(`Video-aula com ID "${videoLessonId}" não encontrada.`);
    }

    // Verificar permissão: usar teacher se disponível, senão usar uploadedBy (legado)
    const ownerId = videoLesson.teacher?.id || videoLesson.uploadedBy?.id;
    if (!ownerId) {
      throw new BadRequestException('Video-aula não possui professor associado.');
    }

    if (ownerId !== teacherId) {
      throw new ForbiddenException('Você não tem permissão para adicionar anexos a esta video-aula.');
    }

    const classId = videoLesson.class.id;
    const uploadedResults: { url: string; name: string }[] = [];

    // Extrair path base da video-aula (sem o nome do arquivo de vídeo)
    // Se objectKey não existir ou não seguir o padrão, construir manualmente
    let basePath: string;
    if (videoLesson.objectKey && videoLesson.objectKey.startsWith(`${this.bucketName}/`)) {
      basePath = videoLesson.objectKey
        .replace(`${this.bucketName}/`, '')
        .replace(/\/video\.\w+$/, ''); // Remove /video.{ext}
    } else {
      // Construir path manualmente usando os IDs disponíveis
      basePath = `${classId}/${videoLesson.id}/${ownerId}`;
    }

    for (const file of files) {
      const sanitizedOriginalName = file.originalname
        .normalize('NFKD')
        .replace(/[^\w.\- ]+/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_');

      const uuid = nanoid();
      const fileName = `${uuid}-${sanitizedOriginalName}`;
      const storagePath = `${basePath}/${fileName}`;

      const fileUrl = await this.storageService.uploadFileTo(
        this.bucketName,
        storagePath,
        file.buffer,
        file.mimetype || 'application/octet-stream',
      );

      uploadedResults.push({
        url: fileUrl,
        name: this.storageService.extractOriginalFileNameFromUrl(fileUrl),
      });

      const current = videoLesson.attachmentUrls || [];
      videoLesson.attachmentUrls = [...current, fileUrl];
    }

    await this.videoLessonRepository.save(videoLesson);

    return {
      videoLessonId,
      uploaded: uploadedResults,
      attachmentUrls: videoLesson.attachmentUrls || [],
    };
  }

  /**
   * Lista anexos de uma video-aula
   */
  async listAttachments(videoLessonId: string): Promise<{
    videoLessonId: string;
    attachments: { url: string; name: string }[];
  }> {
    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id: videoLessonId },
    });

    if (!videoLesson) {
      throw new NotFoundException(`Video-aula com ID "${videoLessonId}" não encontrada.`);
    }

    const attachments = (videoLesson.attachmentUrls || []).map((url) => {
      const path = this.storageService.extractPathFromUrl(url, this.bucketName);
      const fileName = path ? path.split('/').pop() || 'arquivo' : 'arquivo';
      // Remover UUID do início do nome
      const parts = fileName.split('-');
      const originalFileName = parts.length > 1 ? parts.slice(1).join('-') : fileName;
      return {
        url,
        name: originalFileName,
      };
    });

    return { videoLessonId, attachments };
  }

  /**
   * Remove um anexo de uma video-aula
   */
  async removeAttachment(
    videoLessonId: string,
    attachmentUrl: string,
    teacherId: string,
  ): Promise<{
    videoLessonId: string;
    removedUrl: string;
    attachmentUrls: string[];
  }> {
    if (!attachmentUrl) {
      throw new BadRequestException('URL do anexo é obrigatória.');
    }

    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id: videoLessonId },
      relations: ['teacher', 'uploadedBy'],
    });

    if (!videoLesson) {
      throw new NotFoundException(`Video-aula com ID "${videoLessonId}" não encontrada.`);
    }

    // Verificar permissão: usar teacher se disponível, senão usar uploadedBy (legado)
    const ownerId = videoLesson.teacher?.id || videoLesson.uploadedBy?.id;
    if (!ownerId) {
      throw new BadRequestException('Video-aula não possui professor associado.');
    }

    if (ownerId !== teacherId) {
      throw new ForbiddenException('Você não tem permissão para remover anexos desta video-aula.');
    }

    const path = this.storageService.extractPathFromUrl(attachmentUrl, this.bucketName);
    if (!path) {
      throw new BadRequestException('URL inválida para o bucket de video-aulas.');
    }

    await this.storageService.deleteFileFrom(this.bucketName, path);

    const remaining = (videoLesson.attachmentUrls || []).filter((u) => u !== attachmentUrl);
    videoLesson.attachmentUrls = remaining;
    await this.videoLessonRepository.save(videoLesson);

    return {
      videoLessonId,
      removedUrl: attachmentUrl,
      attachmentUrls: remaining,
    };
  }

  // Método para verificar se o Usuario pertence a Classe da Videoaula
  private async ensureUserCanViewClassContent(classId: string, userId: string): Promise<void> {
    const classInstance = await this.classRepository.findOne({
      where: { id: classId },
      relations: ['teacher'],
    });

    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    const isTeacher = classInstance.teacher?.id === userId;
    const isEnrolled = await this.enrollmentRepository.findOneBy({
      class: { id: classId },
      student: { id: userId },
    });

    if (!isTeacher && !isEnrolled) {
      throw new ForbiddenException('Você não tem acesso ao conteúdo desta turma.');
    }
  }
}
