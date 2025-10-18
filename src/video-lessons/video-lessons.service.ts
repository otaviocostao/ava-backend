import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';
import { VideoLesson } from './entities/video-lesson.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';

@Injectable()
export class VideoLessonsService {
  constructor(
    @InjectRepository(VideoLesson)
    private videoLessonRepository: Repository<VideoLesson>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
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

  async findAllByClass(classId: string, requestingUserId: string): Promise<VideoLesson[]> {
    await this.ensureUserCanViewClassContent(classId, requestingUserId);

    return this.videoLessonRepository.find({
      where: { class: { id: classId } },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async findOne(id: string, requestingUserId: string): Promise<VideoLesson> {
    const videoLesson = await this.videoLessonRepository.findOne({
      where: { id },
      relations: ['class', 'uploadedBy'],
    });

    if (!videoLesson) {
      throw new NotFoundException(`Videoaula com ID "${id}" não encontrada.`);
    }

    await this.ensureUserCanViewClassContent(videoLesson.class.id, requestingUserId);

    return videoLesson;
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
