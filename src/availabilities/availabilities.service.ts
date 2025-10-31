import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { FindTeacherAvailabilitiesDto } from './dto/find-teacher-availabilities.dto';
import { Availability } from './entities/availability.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AvailabilitiesService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async ensureTeacherExists(teacherId: string): Promise<User> {
    const teacher = await this.userRepository.findOne({ where: { id: teacherId } });

    if (!teacher) {
      throw new NotFoundException(`Professor com ID "${teacherId}" nao encontrado.`);
    }

    return teacher;
  }

  private async getAvailabilityOrFail(id: string): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['teacher'],
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
    const { teacherId, semester, dayOfWeek, startTime, endTime } = createAvailabilityDto;

    const teacher = await this.ensureTeacherExists(teacherId);

    this.validateTimeRange(startTime, endTime);

    const availability = this.availabilityRepository.create({
      semester,
      dayOfWeek,
      startTime,
      endTime,
      teacher,
    });

    return this.availabilityRepository.save(availability);
  }

  async findAll(): Promise<Availability[]> {
    return this.availabilityRepository.find({
      relations: ['teacher'],
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

    if (updateAvailabilityDto.semester !== undefined) {
      availability.semester = updateAvailabilityDto.semester;
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

    const { semester, dayOfWeek } = filters ?? {};

    const where = {
      teacher: { id: teacherId },
      ...(semester ? { semester } : {}),
      ...(dayOfWeek ? { dayOfWeek } : {}),
    };

    return this.availabilityRepository.find({
      where,
      relations: ['teacher'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }
}
