import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { Class } from 'src/classes/entities/class.entity';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';
import { LessonPlansService } from 'src/lesson-plans/lesson-plans.service';
import { LessonPlan } from 'src/lesson-plans/entities/lesson-plan.entity';
import { AcademicPeriodsService } from 'src/academic-periods/academic-periods.service';

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
    @InjectRepository(LessonPlan)
    private readonly lessonPlanRepository: Repository<LessonPlan>,
    private readonly lessonPlansService: LessonPlansService,
    private readonly academicPeriodsService: AcademicPeriodsService,
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

  // Método auxiliar para gerar datas de um dia da semana no intervalo
  private generateDatesForDayOfWeek(startDate: Date, endDate: Date, dayOfWeek: DayOfWeek): Date[] {
    const dates: Date[] = [];
    const dayOfWeekMap: Record<DayOfWeek, number> = {
      [DayOfWeek.SUNDAY]: 0,
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [DayOfWeek.WEDNESDAY]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6,
    };

    const targetDay = dayOfWeekMap[dayOfWeek];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Encontrar o primeiro dia da semana alvo
    const dayDiff = (targetDay - currentDate.getDay() + 7) % 7;
    currentDate.setDate(currentDate.getDate() + dayDiff);

    // Gerar todas as datas do dia da semana no intervalo
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7); // Próxima semana
    }

    return dates;
  }

  // Formatar data para DD/MM/YYYY
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Atualizar lesson_plans quando o dayOfWeek do schedule muda
  private async updateLessonPlansForScheduleChange(
    scheduleId: string,
    oldDayOfWeek: DayOfWeek,
    newDayOfWeek: DayOfWeek,
    classEntity: Class,
  ): Promise<void> {
    // Buscar o período acadêmico da classe
    const classWithPeriod = await this.classRepository.findOne({
      where: { id: classEntity.id },
      relations: ['academicPeriod'],
    });

    if (!classWithPeriod?.academicPeriod) {
      return; // Sem período acadêmico, não há o que atualizar
    }

    const academicPeriod = classWithPeriod.academicPeriod;

    if (!academicPeriod.startDate || !academicPeriod.endDate) {
      return; // Sem datas definidas, não há o que atualizar
    }

    // Buscar todos os lesson_plans relacionados ao schedule
    const relatedLessonPlans = await this.lessonPlanRepository.find({
      where: { 
        class: { id: classEntity.id },
        schedule: { id: scheduleId },
      },
      relations: ['schedule'],
      order: { date: 'ASC' },
    });

    if (relatedLessonPlans.length === 0) {
      return; // Sem lesson_plans relacionados, não há o que atualizar
    }

    // Gerar novas datas baseadas no novo dayOfWeek
    const newDates = this.generateDatesForDayOfWeek(
      academicPeriod.startDate,
      academicPeriod.endDate,
      newDayOfWeek,
    );

    // Ordenar lesson_plans por data atual
    relatedLessonPlans.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    // Atualizar cada lesson_plan com nova data correspondente
    for (let i = 0; i < relatedLessonPlans.length && i < newDates.length; i++) {
      const lessonPlan = relatedLessonPlans[i];
      const newDate = newDates[i];
      const formattedDate = newDate.toISOString().split('T')[0]; // YYYY-MM-DD

      // Atualizar apenas a data, mantendo conteúdo e status
      await this.lessonPlansService.update(lessonPlan.id, {
        date: formattedDate,
      });
    }

    // Se houver mais lesson_plans do que datas no novo período, remover os excedentes
    if (relatedLessonPlans.length > newDates.length) {
      const excessLessonPlans = relatedLessonPlans.slice(newDates.length);
      for (const lessonPlan of excessLessonPlans) {
        // Verificar se o lesson_plan já foi realizado antes de excluir
        if (lessonPlan.status !== 'realizada') {
          await this.lessonPlansService.remove(lessonPlan.id);
        }
      }
    }

    // Se houver menos lesson_plans, criar os faltantes
    if (relatedLessonPlans.length < newDates.length) {
      const missingDates = newDates.slice(relatedLessonPlans.length);
      for (const date of missingDates) {
        const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const formattedDateDisplay = this.formatDate(date);
        const content = `Plano de aula para ${formattedDateDisplay} - A definir`;

        await this.lessonPlansService.create({
          classId: classEntity.id,
          scheduleId: scheduleId,
          date: formattedDate,
          status: 'agendada',
          content,
        });
      }
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

    // Detectar se o dayOfWeek foi alterado
    const dayOfWeekChanged = updateScheduleDto.dayOfWeek && updateScheduleDto.dayOfWeek !== schedule.dayOfWeek;
    const oldDayOfWeek = schedule.dayOfWeek;

    schedule.dayOfWeek = dayOfWeek;
    schedule.startTime = startTime;
    schedule.endTime = endTime;

    if (updateScheduleDto.room !== undefined) {
      schedule.room = updateScheduleDto.room;
    }

    const savedSchedule = await this.scheduleRepository.save(schedule);

    // Se o dayOfWeek foi alterado, atualizar os lesson_plans relacionados
    if (dayOfWeekChanged && oldDayOfWeek) {
      await this.updateLessonPlansForScheduleChange(
        id,
        oldDayOfWeek,
        dayOfWeek,
        schedule.class,
      );
    }

    return savedSchedule;
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
