import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { Class } from 'src/classes/entities/class.entity';

@Injectable()
export class LiveSessionsService {
  constructor(
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  async create(dto: CreateLiveSessionDto): Promise<LiveSession> {
    const classInstance = await this.classRepository.findOne({ where: { id: dto.classId } });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${dto.classId}" não encontrada.`);
    }
    const entity = this.liveSessionRepository.create({
      title: dto.title,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      meetingUrl: dto.meetingUrl ?? null,
      class: classInstance,
    });
    return this.liveSessionRepository.save(entity);
    }

  findAll(): Promise<LiveSession[]> {
    return this.liveSessionRepository.find({ relations: ['class'] });
  }

  findByClassId(classId: string): Promise<LiveSession[]> {
    return this.liveSessionRepository.find({
      where: { class: { id: classId } },
      order: { startAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LiveSession> {
    const found = await this.liveSessionRepository.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Sessão com ID "${id}" não encontrada.`);
    }
    return found;
  }

  async update(id: string, dto: UpdateLiveSessionDto): Promise<LiveSession> {
    const entity = await this.findOne(id);
    if (dto.title !== undefined) entity.title = dto.title;
    if (dto.meetingUrl !== undefined) entity.meetingUrl = dto.meetingUrl;
    if (dto.startAt !== undefined) entity.startAt = new Date(dto.startAt);
    if (dto.endAt !== undefined) entity.endAt = new Date(dto.endAt);
    return this.liveSessionRepository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const result = await this.liveSessionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Sessão com ID "${id}" não encontrada.`);
    }
  }
}


