import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { Class } from 'src/classes/entities/class.entity';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

interface ConflictCheckParams {
  classId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  ignoreScheduleId?: string;
}

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  private async ensureClassExists(classId: string): Promise<Class> {
    const classInstance = await this.classRepository.findOne({ where: { id: classId } });

    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" nao encontrada.`);
    }

    return classInstance;
  }

  private async getScheduleOrFail(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['class', 'class.discipline', 'class.teacher'],
    });

    if (!schedule) {
      throw new NotFoundException(`Horario com ID "${id}" nao encontrado.`);
    }

    return schedule;
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      throw new BadRequestException('Horarios devem estar no formato HH:mm.');
    }

    return hours * 60 + minutes;
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    const startMinutes = this.toMinutes(startTime);
    const endMinutes = this.toMinutes(endTime);

    if (startMinutes >= endMinutes) {
      throw new BadRequestException('O horario de inicio deve ser menor que o horario de termino.');
    }
  }

  private async assertNoConflicts(params: ConflictCheckParams): Promise<void> {
    const { classId, dayOfWeek, startTime, endTime, ignoreScheduleId } = params;

    const conflictQuery = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoin('schedule.class', 'class')
      .where('class.id = :classId', { classId })
      .andWhere('schedule.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere('(schedule.startTime < :endTime AND schedule.endTime > :startTime)', {
        startTime,
        endTime,
      });

    if (ignoreScheduleId) {
      conflictQuery.andWhere('schedule.id <> :ignoreScheduleId', { ignoreScheduleId });
    }

    const hasConflict = await conflictQuery.getOne();

    if (hasConflict) {
      throw new ConflictException('Ja existe um horario cadastrado que conflita com o intervalo informado.');
    }
  }

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const { classId, dayOfWeek, startTime, endTime, room } = createScheduleDto;

    const classInstance = await this.ensureClassExists(classId);

    this.validateTimeRange(startTime, endTime);

    await this.assertNoConflicts({ classId, dayOfWeek, startTime, endTime });

    const newSchedule = this.scheduleRepository.create({
      dayOfWeek,
      startTime,
      endTime,
      room,
      class: classInstance,
    });

    return this.scheduleRepository.save(newSchedule);
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      relations: ['class', 'class.discipline', 'class.teacher'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Schedule> {
    return this.getScheduleOrFail(id);
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.getScheduleOrFail(id);

    const classId = updateScheduleDto.classId ?? schedule.class.id;
    const dayOfWeek = updateScheduleDto.dayOfWeek ?? schedule.dayOfWeek;
    const startTime = updateScheduleDto.startTime ?? schedule.startTime;
    const endTime = updateScheduleDto.endTime ?? schedule.endTime;

    if (updateScheduleDto.classId && updateScheduleDto.classId !== schedule.class.id) {
      schedule.class = await this.ensureClassExists(updateScheduleDto.classId);
    }

    this.validateTimeRange(startTime, endTime);

    await this.assertNoConflicts({
      classId,
      dayOfWeek,
      startTime,
      endTime,
      ignoreScheduleId: id,
    });

    schedule.dayOfWeek = dayOfWeek;
    schedule.startTime = startTime;
    schedule.endTime = endTime;

    if (updateScheduleDto.room !== undefined) {
      schedule.room = updateScheduleDto.room;
    }

    return this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const result = await this.scheduleRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Horario com ID "${id}" nao encontrado.`);
    }
  }

  async findByClassId(classId: string): Promise<Schedule[]> {
    await this.ensureClassExists(classId);

    return this.scheduleRepository.find({
      where: { class: { id: classId } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }
}
