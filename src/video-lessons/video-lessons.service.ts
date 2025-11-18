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
    disciplineId: string,
    createDto: CreateVideoLessonUploadDto,
    teacherId: string,
  ): Promise<{
    id: string;
    objectKey: string;
    uploadUrl: string;
    expiresInSeconds: number;
  }> {
    // Verificar se o usuário é professor de alguma turma da disciplina informada
    const classOfDiscipline = await this.classRepository.findOne({
      where: {
        discipline: { id: disciplineId },
        teacher: { id: teacherId },
      },
      relations: ['discipline', 'teacher'],
    });

    if (!classOfDiscipline) {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar vídeos nesta disciplina.',
      );
    }

    // Criar registro no banco com status 'pending'
    const newVideoLesson = this.videoLessonRepository.create({
      title: createDto.title,
      description: createDto.description,
      discipline: { id: disciplineId },
      uploadedBy: { id: teacherId },
      objectKey: null,
      status: 'pending',
      visibility: 'class',
      attachmentUrls: [],
    });

    const savedVideoLesson = await this.videoLessonRepository.save(newVideoLesson);

    // Padrão final de caminho: video-aulas/{disciplineId}/{videoLessonId}
    const objectPath = `${disciplineId}/${savedVideoLesson.id}`;
    const fullObjectKey = `${this.bucketName}/${objectPath}`;
    savedVideoLesson.objectKey = fullObjectKey;
    await this.videoLessonRepository.save(savedVideoLesson);

    // Gerar URL de upload (nota: Supabase não tem presigned URLs para upload como S3)
    // Retornamos a URL da API REST que será usada pelo backend para fazer upload
    const uploadUrl = await this.storageService.createPresignedUploadUrl(
      this.bucketName,
      objectPath,
      this.presignedUrlExpiresIn,
      createDto.mimeType || 'application/octet-stream',
    );

    return {
      id: savedVideoLesson.id,
      objectKey: fullObjectKey,
      uploadUrl,
      expiresInSeconds: this.presignedUrlExpiresIn,
    };
  }

  /**
   * Cria a video-aula e faz upload do arquivo no mesmo fluxo
   */
  async createWithFile(
    disciplineId: string,
    createDto: CreateVideoLessonUploadDto,
    teacherId: string,
    file: Express.Multer.File,
  ): Promise<{
    id: string;
    objectKey: string;
    fileUrl: string;
    status: string;
  }> {
    // Verificar se o usuário é professor de alguma turma da disciplina informada
    const classOfDiscipline = await this.classRepository.findOne({
      where: {
        discipline: { id: disciplineId },
        teacher: { id: teacherId },
      },
      relations: ['discipline', 'teacher'],
    });

    if (!classOfDiscipline) {
      throw new ForbiddenException(
        'Você não tem permissão para adicionar vídeos nesta disciplina.',
      );
    }

    if (!file) {
      throw new BadRequestException('Arquivo não enviado (campo "file" obrigatório).');
    }

    // Criar registro no banco com status 'pending' e sem objectKey
    const newVideoLesson = this.videoLessonRepository.create({
      title: createDto.title,
      description: createDto.description,
      discipline: { id: disciplineId },
      uploadedBy: { id: teacherId },
      objectKey: null,
      status: 'pending',
      visibility: 'class',
      attachmentUrls: [],
    });

    const savedVideoLesson = await this.videoLessonRepository.save(newVideoLesson);

    // Definir objectKey final: video-aulas/{disciplineId}/{videoLessonId}
    const objectPath = `${disciplineId}/${savedVideoLesson.id}`;
    const fullObjectKey = `${this.bucketName}/${objectPath}`;
    savedVideoLesson.objectKey = fullObjectKey;

    // Enviar arquivo ao bucket
    const fileUrl = await this.storageService.uploadFileTo(
      this.bucketName,
      objectPath,
      file.buffer,
      file.mimetype || createDto.mimeType || 'application/octet-stream',
    );

    // Marcar como ready
    savedVideoLesson.status = 'ready';

    await this.videoLessonRepository.save(savedVideoLesson);

    return {
      id: savedVideoLesson.id,
      objectKey: fullObjectKey,
      fileUrl,
      status: savedVideoLesson.status,
    };
  }

  /**
   * Faz upload do arquivo de vídeo via backend para o bucket
   * Caminho: video-aulas/{disciplineId}/{videoLessonId}
   */
  async uploadVideoFile(
    videoLessonId: string,
    teacherId: string,
    file: Express.Multer.File,
  ): Promise<{
    id: string;
    objectKey: string;
    fileUrl: string;
  }> {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado (campo "file" obrigatório).');
    }

    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id: videoLessonId },
      relations: ['discipline', 'uploadedBy'],
    });

    if (!videoLesson) {
      throw new NotFoundException(`Video-aula com ID "${videoLessonId}" não encontrada.`);
    }

    // Verificar permissão
    const ownerId = videoLesson.uploadedBy?.id;
    if (!ownerId || ownerId !== teacherId) {
      throw new ForbiddenException('Você não tem permissão para enviar o vídeo desta video-aula.');
    }

    // Apenas um vídeo permitido: exige status 'pending'
    if (videoLesson.status !== 'pending') {
      throw new BadRequestException('Video-aula já possui vídeo enviado ou já foi finalizada.');
    }

    // Garante objectKey no padrão exigido
    if (!videoLesson.objectKey) {
      const objectPath = `${videoLesson.discipline.id}/${videoLesson.id}`;
      videoLesson.objectKey = `${this.bucketName}/${objectPath}`;
    }

    const path = videoLesson.objectKey.replace(`${this.bucketName}/`, '');

    // Faz upload do arquivo para o bucket
    const fileUrl = await this.storageService.uploadFileTo(
      this.bucketName,
      path,
      file.buffer,
      file.mimetype || 'application/octet-stream',
    );

    await this.videoLessonRepository.save(videoLesson);

    return {
      id: videoLesson.id,
      objectKey: videoLesson.objectKey,
      fileUrl,
    };
  }

  /**
   * Finaliza o upload e marca a video-aula como 'ready'
   */
  async finalizeUpload(videoLessonId: string, teacherId: string): Promise<VideoLesson> {
    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id: videoLessonId },
      relations: ['discipline', 'uploadedBy'],
    });

    if (!videoLesson) {
      throw new NotFoundException(`Video-aula com ID "${videoLessonId}" não encontrada.`);
    }

    // Verificar permissão
    const ownerId = videoLesson.uploadedBy?.id;
    if (!ownerId) {
      throw new BadRequestException('Video-aula não possui usuário associado.');
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
    disciplineId: string,
    videoLessonId: string,
    requestingUserId: string,
  ): Promise<{
    url: string;
    expiresInSeconds: number;
  }> {
    // Verificar permissão de acesso
    await this.ensureUserCanViewDisciplineContent(disciplineId, requestingUserId);

    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id: videoLessonId, discipline: { id: disciplineId } },
    });

    if (!videoLesson) {
      throw new NotFoundException(`Video-aula com ID "${videoLessonId}" não encontrada.`);
    }

    if (videoLesson.status !== 'ready') {
      throw new BadRequestException(`Video-aula ainda não está pronta para visualização (status: ${videoLesson.status}).`);
    }

    if (!videoLesson.objectKey) {
      throw new BadRequestException('Video-aula não possui arquivo associado para streaming.');
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
    };
  }

  /**
   * Método legado - mantido para compatibilidade
   */
  async create(
    createVideoLessonDto: CreateVideoLessonDto,
    uploaderId: string,
  ): Promise<VideoLesson> {
    const { disciplineId, title, duration } = createVideoLessonDto;

    // Verifica se usuário é professor de alguma turma da disciplina
    const classOfDiscipline = await this.classRepository.findOne({
      where: {
        discipline: { id: disciplineId },
        teacher: { id: uploaderId },
      },
      relations: ['discipline', 'teacher'],
    });

    if (!classOfDiscipline) {
      throw new ForbiddenException('Você não tem permissão para adicionar vídeos nesta disciplina.');
    }

    // Método legado - criar com campos antigos se disponíveis
    const newVideoLesson = this.videoLessonRepository.create({
      title,
      durationSeconds: duration ? duration * 60 : null, // Converter minutos para segundos
      discipline: { id: disciplineId },
      uploadedBy: { id: uploaderId },
      objectKey: null,
      status: 'ready',
      visibility: 'class',
      attachmentUrls: [],
    });

    return this.videoLessonRepository.save(newVideoLesson);
  }

  async findAllByDiscipline(disciplineId: string, requestingUserId?: string): Promise<VideoLesson[]> {
    if (requestingUserId) {
      await this.ensureUserCanViewDisciplineContent(disciplineId, requestingUserId);
    }

    return this.videoLessonRepository.find({
      where: { 
        discipline: { id: disciplineId },
        deletedAt: IsNull(), // Soft delete
      },
      relations: ['uploadedBy', 'discipline'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, requestingUserId?: string): Promise<VideoLesson> {
    const videoLesson = await this.videoLessonRepository.findOne({
      where: { 
        id,
        deletedAt: IsNull(), // Soft delete
      },
      relations: ['discipline', 'uploadedBy'],
    });

    if (!videoLesson) {
      throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    if (requestingUserId) {
      await this.ensureUserCanViewDisciplineContent(videoLesson.discipline.id, requestingUserId);
    }

    return videoLesson;
  }

  async findWatchesByDiscipline(disciplineId: string, studentId: string) {
    await this.ensureUserCanViewDisciplineContent(disciplineId, studentId);
    const watches = await this.videoLessonWatchRepository.find({
      where: { student: { id: studentId } },
      relations: ['videoLesson', 'videoLesson.discipline'],
      order: { watchedAt: 'DESC' },
    });
    return watches
      .filter(w => w.videoLesson?.discipline?.id === disciplineId)
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
        relations: ['discipline', 'uploadedBy'],
    });
    
    if (!videoLesson) {
        throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    // Verificar permissão
    const ownerId = videoLesson.uploadedBy?.id;
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
        relations: ['discipline', 'uploadedBy'],
    });

    if (!videoLesson) {
        throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    // Verificar permissão
    const ownerId = videoLesson.uploadedBy?.id;
    if (!ownerId || ownerId !== requestingUserId) {
      throw new ForbiddenException('Você não tem permissão para remover este recurso.');
    }

    // Soft delete
    videoLesson.deletedAt = new Date();
    await this.videoLessonRepository.save(videoLesson);

    // Opcional: remover arquivo do storage
    try {
      if (videoLesson.objectKey) {
        const path = videoLesson.objectKey.replace(`${this.bucketName}/`, '');
        await this.storageService.deleteFileFrom(this.bucketName, path);
      }
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

    await this.ensureUserCanViewDisciplineContent(videoLesson.discipline.id, studentId);

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

  // Anexos desabilitados: o fluxo atual permite apenas um arquivo de vídeo por video-aula.

  // Método para verificar se o usuário tem acesso ao conteúdo da disciplina
  private async ensureUserCanViewDisciplineContent(disciplineId: string, userId: string): Promise<void> {
    // Professor da disciplina (em qualquer turma)
    const teachesInDiscipline = await this.classRepository.findOne({
      where: {
        discipline: { id: disciplineId },
        teacher: { id: userId },
      },
      relations: ['discipline', 'teacher'],
    });

    if (teachesInDiscipline) {
      return;
    }

    // Estudante matriculado em qualquer turma da disciplina
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        class: { discipline: { id: disciplineId } },
        student: { id: userId },
      },
      relations: ['class', 'class.discipline', 'student'],
    });

    if (!enrollment) {
      throw new ForbiddenException('Você não tem acesso ao conteúdo desta disciplina.');
    }
  }
}
