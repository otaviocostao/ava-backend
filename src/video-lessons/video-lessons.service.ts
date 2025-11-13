import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';
import { VideoLesson } from './entities/video-lesson.entity';
import { VideoLessonWatch } from './entities/video-lesson-watch.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class VideoLessonsService {
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
  ) {}

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

    const newVideoLesson = this.videoLessonRepository.create({
      title,
      videoUrl,
      duration,
      class: { id: classId },
      uploadedBy: { id: uploaderId },
    });

    return this.videoLessonRepository.save(newVideoLesson);
  }

  async findAllByClass(classId: string, requestingUserId?: string): Promise<VideoLesson[]> {
    if (requestingUserId) {
      await this.ensureUserCanViewClassContent(classId, requestingUserId);
    }

    return this.videoLessonRepository.find({
      where: { class: { id: classId } },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async findOne(id: string, requestingUserId?: string): Promise<VideoLesson> {
    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id },
      relations: ['class', 'uploadedBy'],
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
        where: { id },
        relations: ['uploadedBy'],
    });
    
    if (!videoLesson) {
        throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    if (videoLesson.uploadedBy?.id !== requestingUserId) {
      throw new ForbiddenException('Você não tem permissão para editar este recurso.');
    }

    delete updateVideoLessonDto.classId;

    this.videoLessonRepository.merge(videoLesson, updateVideoLessonDto);
    return this.videoLessonRepository.save(videoLesson);
  }

  async remove(id: string, requestingUserId: string): Promise<void> {
    const videoLesson = await this.videoLessonRepository.findOne({
        where: { id },
        relations: ['uploadedBy'],
    });

    if (!videoLesson) {
        throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    if (videoLesson.uploadedBy?.id !== requestingUserId) {
      throw new ForbiddenException('Você não tem permissão para remover este recurso.');
    }

    await this.videoLessonRepository.remove(videoLesson);
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
