import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessonPlan } from './entities/lesson-plan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LessonPlansService {
  
  constructor(
      @InjectRepository(LessonPlan)
      private readonly lessonPlanRepository: Repository<LessonPlan>,
      private readonly classRepository: Repository<LessonPlan>,
  ) {}

  async create(createLessonPlanDto: CreateLessonPlanDto) : Promise<LessonPlan> {
    const { classId } = createLessonPlanDto;

    const classInstance = await this.classRepository.findOneBy({ id: classId });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    const newLessonPlan = this.lessonPlanRepository.create({
      ...createLessonPlanDto,
      class: {id: classId},
    })

    return this.lessonPlanRepository.save(newLessonPlan);
  }

  findAll() {
    return this.lessonPlanRepository.find();
  }

  async findOne(id: string): Promise<LessonPlan> {
      const lessonPlan = await this.lessonPlanRepository.findOne({
        where: { id },
        relations: ['class.discipline'],
      });
  
      if (!lessonPlan) {
        throw new NotFoundException(`Plano de aula com ID "${id}" não encontrado.`);
      }
      return lessonPlan;
    }

  async update(id: string, updateLessonPlanDto: UpdateLessonPlanDto): Promise<LessonPlan> {
      const lessonPlan = await this.lessonPlanRepository.preload({ 
        id,
        ...updateLessonPlanDto,
      });
  
      if(!lessonPlan){
        throw new NotFoundException(`Plano de aula com o ID '${id}' não encontrado.`)
      }
  
      return await this.lessonPlanRepository.save(lessonPlan);
    }

  async remove(id: string): Promise<void> {
    const result = await this.lessonPlanRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Plano de aula com ID "${id}" não encontrado.`);
    }
  }
}
