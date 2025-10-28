import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { Class } from 'src/classes/entities/class.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const { class_id, ...rest } = createActivityDto;

    const classEntity = await this.classRepository.findOne({
      where: { id: class_id },
    });

    if (!classEntity) {
      throw new NotFoundException(
        `Turma com ID "${class_id}" nao encontrada.`,
      );
    }

    const activity = this.activityRepository.create({
      ...rest,
      class: classEntity,
    });

    return this.activityRepository.save(activity);
  }

  async findAll(): Promise<Activity[]> {
    return this.activityRepository.find();
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ['class'],
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto): Promise<Activity> {
    const { class_id, ...rest } = updateActivityDto;

    const preloadData: Partial<Activity> = {
      id,
      ...rest,
    };

    if (class_id !== undefined) {
      const classEntity = await this.classRepository.findOne({
        where: { id: class_id },
      });

      if (!classEntity) {
        throw new NotFoundException(
          `Turma com ID "${class_id}" nao encontrada.`,
        );
      }

      preloadData.class = classEntity;
    }

    const activity = await this.activityRepository.preload(preloadData);
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
    return this.activityRepository.save(activity);
  }

  async remove(id: string): Promise<void> {
    const activity = await this.findOne(id);
    await this.activityRepository.remove(activity);
  }

  async findByClassId(classId: string): Promise<Activity[]> {
    const activities = await this.activityRepository.find({ where: { class: { id: classId } } });

    if (!activities) {
      throw new NotFoundException(`Atividades da turma com ID "${classId}" não encontradas.`);
    }
    
    return activities;
  }
}
