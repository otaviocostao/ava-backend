import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { FindTeacherAvailabilitiesDto } from './dto/find-teacher-availabilities.dto';
import { Availability } from './entities/availability.entity';
import { User } from 'src/users/entities/user.entity';
import { AcademicPeriod } from 'src/academic-periods/entities/academic-period.entity';

@Injectable()
export class AvailabilitiesService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AcademicPeriod)
    private readonly academicPeriodRepository: Repository<AcademicPeriod>,
  ) {}

  private async ensureTeacherExists(teacherId: string): Promise<User> {
    const teacher = await this.userRepository.findOne({ where: { id: teacherId } });

    if (!teacher) {
      throw new NotFoundException(`Professor com ID "${teacherId}" nao encontrado.`);
    }

    return teacher;
  }

  private async ensureAcademicPeriodExists(academicPeriodId: string): Promise<AcademicPeriod> {
    const academicPeriod = await this.academicPeriodRepository.findOne({
      where: { id: academicPeriodId },
    });

    if (!academicPeriod) {
      throw new NotFoundException(`Período letivo com ID "${academicPeriodId}" não encontrado.`);
    }

    return academicPeriod;
  }

  private async getAvailabilityOrFail(id: string): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['teacher', 'academicPeriod'],
    });

    if (!availability) {
      throw new NotFoundException(`Disponibilidade com ID "${id}" nao encontrada.`);
    }

    return availability;
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

  async create(createAvailabilityDto: CreateAvailabilityDto): Promise<Availability> {
    const { teacherId, academicPeriodId, dayOfWeek, startTime, endTime } = createAvailabilityDto;

    const [teacher, academicPeriod] = await Promise.all([
      this.ensureTeacherExists(teacherId),
      this.ensureAcademicPeriodExists(academicPeriodId),
    ]);

    this.validateTimeRange(startTime, endTime);

    const availability = this.availabilityRepository.create({
      dayOfWeek,
      startTime,
      endTime,
      teacher,
      academicPeriod,
    });

    return this.availabilityRepository.save(availability);
  }

  async findAll(): Promise<Availability[]> {
    return this.availabilityRepository.find({
      relations: ['teacher', 'academicPeriod'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Availability> {
    return this.getAvailabilityOrFail(id);
  }

  async update(id: string, updateAvailabilityDto: UpdateAvailabilityDto): Promise<Availability> {
    const availability = await this.getAvailabilityOrFail(id);

    if (updateAvailabilityDto.teacherId) {
      if (updateAvailabilityDto.teacherId !== availability.teacher.id) {
        availability.teacher = await this.ensureTeacherExists(updateAvailabilityDto.teacherId);
      }
    }

    if (updateAvailabilityDto.academicPeriodId) {
      if (updateAvailabilityDto.academicPeriodId !== availability.academicPeriod.id) {
        availability.academicPeriod = await this.ensureAcademicPeriodExists(updateAvailabilityDto.academicPeriodId);
      }
    }

    if (updateAvailabilityDto.dayOfWeek !== undefined) {
      availability.dayOfWeek = updateAvailabilityDto.dayOfWeek;
    }

    const nextStartTime = updateAvailabilityDto.startTime ?? availability.startTime;
    const nextEndTime = updateAvailabilityDto.endTime ?? availability.endTime;

    this.validateTimeRange(nextStartTime, nextEndTime);

    availability.startTime = nextStartTime;
    availability.endTime = nextEndTime;

    return this.availabilityRepository.save(availability);
  }

  async remove(id: string): Promise<void> {
    const result = await this.availabilityRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Disponibilidade com ID "${id}" nao encontrada.`);
    }
  }

  async findByTeacherId(teacherId: string, filters?: FindTeacherAvailabilitiesDto): Promise<Availability[]> {
    await this.ensureTeacherExists(teacherId);

    const { academicPeriodId, dayOfWeek } = filters ?? {};

    const where = {
      teacher: { id: teacherId },
      ...(academicPeriodId ? { academicPeriod: { id: academicPeriodId } } : {}),
      ...(dayOfWeek ? { dayOfWeek } : {}),
    };

    return this.availabilityRepository.find({
      where,
      relations: ['teacher', 'academicPeriod'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }
}
