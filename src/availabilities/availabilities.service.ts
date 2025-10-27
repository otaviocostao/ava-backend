import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { DayOfWeek } from 'src/common/enums/day-of-week.enum';

@Injectable()
export class AvailabilitiesService {

  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    ) {}

  async create(createAvailabilityDto: CreateAvailabilityDto) : Promise<Availability> {
    const {teacherId} = createAvailabilityDto;

    const teacher = await this.userRepository.findOneBy({id: teacherId});
    if(!teacher) {
      throw new NotFoundException(`Usuário com ID "${teacherId}" não encontrado.`);
    }

    const newAvailability = this.availabilityRepository.create({
      ...createAvailabilityDto,
      teacher: {id: teacherId},
    })

    return this.availabilityRepository.save(newAvailability);
  }

  findAll() {
    return this.availabilityRepository.find();
  }

  async findOne(id: string) {
    const availability = await this.availabilityRepository.findOne({
        where: { id }
      });
  
      if (!availability) {
        throw new NotFoundException(`Disponibilidade com ID "${id}" não encontrada.`);
      }

      return availability;
  }

  async update(id: string, updateAvailabilityDto: UpdateAvailabilityDto) : Promise<Availability> {
    const availability = await this.availabilityRepository.preload({
      id,
      ...updateAvailabilityDto,
    })

    if (!availability){
      throw new NotFoundException(`Disponibilidade com ID "${id}" não encontrada.`);
    }
    return await this.availabilityRepository.save(availability);
  }

  async remove(id: string) : Promise<void> {
    const result = await this.availabilityRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Disponibilidade com ID "${id}" não encontrada.`);
    }
  }

  // Busca as disponibilidades de um professor, com suporte a filtros opcionais por semestre/dia.
  async findByTeacherId(
    teacherId: string,
    filters?: { semester?: string; dayOfWeek?: DayOfWeek }
  ) {
    const whereClause: any = { teacher: { id: teacherId } };

    if (filters?.semester) {
      whereClause.semester = filters.semester;
    }
    if (filters?.dayOfWeek) {
      whereClause.dayOfWeek = filters.dayOfWeek;
    }

    const availabilities = await this.availabilityRepository.find({ where: whereClause });

    if (!availabilities || availabilities.length === 0) {
      throw new NotFoundException(
        `Disponibilidades do professor com ID "${teacherId}" não encontradas${filters?.semester ? ` no semestre "${filters.semester}"` : ''}${filters?.dayOfWeek ? ` no dia "${filters.dayOfWeek}"` : ''}.`
      );
    }

    return availabilities;
  }
}
