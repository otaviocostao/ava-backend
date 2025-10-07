import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVideoLessonDto } from './dto/create-video-lesson.dto';
import { UpdateVideoLessonDto } from './dto/update-video-lesson.dto';
import { VideoLesson } from './entities/video-lesson.entity';

@Injectable()
export class VideoLessonsService {
  constructor(
    @InjectRepository(VideoLesson)
    private videoLessonRepository: Repository<VideoLesson>,
  ) {}

  async create(createVideoLessonDto: CreateVideoLessonDto): Promise<VideoLesson> {
    try {
      const videoLesson = this.videoLessonRepository.create(createVideoLessonDto);
      return await this.videoLessonRepository.save(videoLesson);
    } catch (error) {
      
      throw new BadRequestException('Não foi possível criar a video aula. Verifique os IDs de classe e usuário.');
    }
  }

  async findAll(): Promise<VideoLesson[]> {
    return this.videoLessonRepository.find();
  }

  async findOne(id: string): Promise<VideoLesson> {
    const videoLesson = await this.videoLessonRepository.findOne({ where: { id } });
    if (!videoLesson) {
      throw new NotFoundException(`O ID "${id}" não existe ou não foi encontrado.`);
    }
    return videoLesson;
  }

  async update(id: string, updateVideoLessonDto: UpdateVideoLessonDto): Promise<VideoLesson> {
    const videoLesson = await this.findOne(id);
    try {
      this.videoLessonRepository.merge(videoLesson, updateVideoLessonDto);
      return await this.videoLessonRepository.save(videoLesson);
    } catch (error) {
      
      throw new BadRequestException('Não foi possível atualizar a video aula. Verifique os IDs de classe e usuário.');
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.videoLessonRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`O ID "${id}" não existe ou não foi encontrado.`);
    }
  }
}
