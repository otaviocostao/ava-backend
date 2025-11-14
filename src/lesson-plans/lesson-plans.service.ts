import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonPlan } from './entities/lesson-plan.entity';
import { Repository } from 'typeorm';
import { Class } from 'src/classes/entities/class.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';

@Injectable()
export class LessonPlansService {
  
  constructor(
      @InjectRepository(LessonPlan)
      private readonly lessonPlanRepository: Repository<LessonPlan>,
      @InjectRepository(Class)
      private readonly classRepository: Repository<Class>,
      @InjectRepository(Schedule)
      private readonly scheduleRepository: Repository<Schedule>,
  ) {}

  async create(createLessonPlanDto: CreateLessonPlanDto) : Promise<LessonPlan> {
    const { classId, scheduleId, ...lessonPlanData } = createLessonPlanDto;

    const classInstance = await this.classRepository.findOneBy({ id: classId });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    let schedule: Schedule | null = null;
    if (scheduleId) {
      schedule = await this.scheduleRepository.findOneBy({ id: scheduleId });
      if (!schedule) {
        throw new NotFoundException(`Horário com ID "${scheduleId}" não encontrado.`);
      }
    }

    const newLessonPlan = this.lessonPlanRepository.create({
      ...lessonPlanData,
      class: { id: classId },
      schedule: schedule ? { id: scheduleId } : null,
      status: lessonPlanData.status || 'agendada',
    });

    return this.lessonPlanRepository.save(newLessonPlan);
  }

  findAll() {
    return this.lessonPlanRepository.find({
      relations: ['class', 'schedule'],
      order: { date: 'ASC' },
    });
  }

  async findOne(id: string): Promise<LessonPlan> {
      const lessonPlan = await this.lessonPlanRepository.findOne({
        where: { id },
        relations: ['class', 'class.discipline', 'schedule'],
      });
  
      if (!lessonPlan) {
        throw new NotFoundException(`Plano de aula com ID "${id}" não encontrado.`);
      }
      return lessonPlan;
    }

  async update(id: string, updateLessonPlanDto: UpdateLessonPlanDto): Promise<LessonPlan> {
      const lessonPlan = await this.lessonPlanRepository.findOne({
        where: { id },
        relations: ['schedule'],
      });

      if (!lessonPlan) {
        throw new NotFoundException(`Plano de aula com o ID '${id}' não encontrado.`);
      }

      const { scheduleId, ...updateData } = updateLessonPlanDto;

      // Atualizar schedule se fornecido
      if (scheduleId !== undefined) {
        if (scheduleId) {
          const schedule = await this.scheduleRepository.findOneBy({ id: scheduleId });
          if (!schedule) {
            throw new NotFoundException(`Horário com ID "${scheduleId}" não encontrado.`);
          }
          lessonPlan.schedule = schedule;
        } else {
          lessonPlan.schedule = null;
        }
      }

      // Aplicar outras atualizações
      Object.assign(lessonPlan, updateData);

      return await this.lessonPlanRepository.save(lessonPlan);
    }

  async remove(id: string): Promise<void> {
    const result = await this.lessonPlanRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Plano de aula com ID "${id}" não encontrado.`);
    }
  }

  async findByClassId(classId: string): Promise<LessonPlan[]> {
    const lessonPlans = await this.lessonPlanRepository.find({ 
      where: { class: { id: classId } },
      relations: ['schedule'],
      order: { date: 'ASC' },
    });

    if (!lessonPlans) {
      throw new NotFoundException(`Planos de aula da turma com ID "${classId}" não encontrados.`);
    }
    
    return lessonPlans;
  }
}
