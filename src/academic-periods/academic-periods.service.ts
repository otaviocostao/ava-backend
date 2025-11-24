import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicPeriod } from './entities/academic-period.entity';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';

@Injectable()
export class AcademicPeriodsService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly academicPeriodRepository: Repository<AcademicPeriod>,
  ) {}

  async create(createAcademicPeriodDto: CreateAcademicPeriodDto): Promise<AcademicPeriod> {
    const { period, startDate, endDate } = createAcademicPeriodDto;

    // Verificar se já existe um período com o mesmo valor
    const existingPeriod = await this.academicPeriodRepository.findOne({
      where: { period },
    });

    if (existingPeriod) {
      throw new ConflictException(`Período letivo "${period}" já existe.`);
    }

    // Validar que a data de fim é posterior à data de início
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      throw new BadRequestException('A data de fim deve ser posterior à data de início.');
    }

    const academicPeriod = this.academicPeriodRepository.create({
      period,
      startDate: start,
      endDate: end,
    });
    return this.academicPeriodRepository.save(academicPeriod);
  }

  async findAll(): Promise<AcademicPeriod[]> {
    return this.academicPeriodRepository.find({
      order: { period: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AcademicPeriod> {
    const academicPeriod = await this.academicPeriodRepository.findOne({
      where: { id },
    });

    if (!academicPeriod) {
      throw new NotFoundException(`Período letivo com ID "${id}" não encontrado.`);
    }

    return academicPeriod;
  }

  async findByPeriod(period: string): Promise<AcademicPeriod | null> {
    return this.academicPeriodRepository.findOne({
      where: { period },
    });
  }

  async update(id: string, updateAcademicPeriodDto: UpdateAcademicPeriodDto): Promise<AcademicPeriod> {
    const academicPeriod = await this.findOne(id);

    if (updateAcademicPeriodDto.period) {
      // Verificar se outro período já usa esse valor
      const existingPeriod = await this.academicPeriodRepository.findOne({
        where: { period: updateAcademicPeriodDto.period },
      });

      if (existingPeriod && existingPeriod.id !== id) {
        throw new ConflictException(`Período letivo "${updateAcademicPeriodDto.period}" já existe.`);
      }

      academicPeriod.period = updateAcademicPeriodDto.period;
    }

    // Atualizar datas se fornecidas
    const startDate = updateAcademicPeriodDto.startDate 
      ? new Date(updateAcademicPeriodDto.startDate) 
      : academicPeriod.startDate;
    const endDate = updateAcademicPeriodDto.endDate 
      ? new Date(updateAcademicPeriodDto.endDate) 
      : academicPeriod.endDate;

    // Validar que a data de fim é posterior à data de início
    if (endDate <= startDate) {
      throw new BadRequestException('A data de fim deve ser posterior à data de início.');
    }

    academicPeriod.startDate = startDate;
    academicPeriod.endDate = endDate;

    return this.academicPeriodRepository.save(academicPeriod);
  }

  async remove(id: string): Promise<void> {
    const academicPeriod = await this.findOne(id);

    // Verificar se o período está sendo usado (isso será verificado pelas constraints do banco)
    // Por enquanto, apenas tenta remover e deixa o banco lançar erro se houver dependências
    const result = await this.academicPeriodRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Período letivo com ID "${id}" não encontrado.`);
    }
  }
}


