import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AttendancesService {

  constructor (
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>
  ) {}

  // Criar nova Frequencia
  async create(createAttendanceDto: CreateAttendanceDto) {

    const attendance = this.attendanceRepository.create(createAttendanceDto);

    return await this.attendanceRepository.save(attendance);
  }

  // Buscar todas as Frequencias
  findAll() : Promise<Attendance[]> {

    return this.attendanceRepository.find();
  }

  // Buscar Frequencia por id
  async findOne(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOneBy({ id });

    if(!attendance){
      throw new NotFoundException(`Frequencia com o ID '${id}' não encontrado.`)
    }
    return attendance;
  }

  //Atualizar Frequencia
  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.attendanceRepository.preload({ 
      id,
      ...updateAttendanceDto,
    });

    if(!attendance){
      throw new NotFoundException(`Frequencia com o ID '${id}' não encontrado.`)
    }

    return await this.attendanceRepository.save(attendance);
  }

  // Excluir Attendance
  async remove(id: string): Promise<void> {
    const result = await this.attendanceRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Deparatamento com o ID '${id}' não encontrado.`);
    }
  }
}