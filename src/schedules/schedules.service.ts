import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { Repository } from 'typeorm';
import { Class } from 'src/classes/entities/class.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto) : Promise<Schedule> {
    const { classId } = createScheduleDto;

    const classInstance = await this.classRepository.findOneBy({ id: classId });

    if (!classInstance) {
        throw new Error(`Turma com ID "${classId}" não encontrada.`);
    }

    const newSchedule = this.scheduleRepository.create({
      ...createScheduleDto,
      class: { id: classId },
    }); 

    return this.scheduleRepository.save(newSchedule);
  }

  findAll() {
    return this.scheduleRepository.find();
  }

  async findOne(id: string) : Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['class', 'class.discipline', 'class.teacher'],
    });

    if (!schedule) {
        throw new Error(`Schedule com ID "${id}" não encontrado.`);
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto):Promise<Schedule> {
    const schedule = await this.scheduleRepository.preload({ id, ...updateScheduleDto });

    if (!schedule) {
        throw new NotFoundException(`Schedule com ID "${id}" não encontrado.`);
    }
    return await this.scheduleRepository.save(schedule);
  }

  async remove(id: string) : Promise<void> {
    const result = await this.scheduleRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Grade horária com ID "${id}" não encontrada.`);
    };
  }

  async findByClassId(classId: string): Promise<Schedule[]> {
    const schedules = await this.scheduleRepository.find({ where: { class: { id: classId } } });

    if (!schedules) {
      throw new NotFoundException(`Grade horária da turma com ID "${classId}" não encontrada.`);
    }
    
    return schedules;
  }
}
