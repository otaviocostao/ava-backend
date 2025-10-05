import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Discipline } from './entities/discipline.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DisciplinesService {

  constructor (
    @InjectRepository(Discipline)
    private readonly disciplineRepository: Repository<Discipline>
  ) {}

  // Criar nova Disciplina
  async create(createDisciplineDto: CreateDisciplineDto) {
    const existingDiscipline = await this.disciplineRepository.findOneBy({
      name: createDisciplineDto.name,
    })

    if(existingDiscipline){
      throw new ConflictException('Esta Disciplina já foi criada.')
    }

    const discipline = this.disciplineRepository.create(createDisciplineDto);

    return await this.disciplineRepository.save(discipline);
  }

  // Buscar todas as Disciplina
  findAll() : Promise<Discipline[]> {
    return this.disciplineRepository.find();
  }

  // Buscar Disciplina por id
  async findOne(id: string): Promise<Discipline> {
    const discipline = await this.disciplineRepository.findOneBy({ id });

    if(!discipline){
      throw new NotFoundException(`Disciplina com o ID '${id}' não encontrada.`)
    }
    return discipline;
  }

  //Atualizar Disciplina
  async update(id: string, updateDisciplineDto: UpdateDisciplineDto): Promise<Discipline> {
    const discipline = await this.disciplineRepository.preload({ 
      id,
      ...updateDisciplineDto,
    });

    if(!discipline){
      throw new NotFoundException(`Disciplina com o ID '${id}' não encontrada.`)
    }

    return await this.disciplineRepository.save(discipline);
  }

  // Excluir Disciplina
  async remove(id: string): Promise<void> {
    const result = await this.disciplineRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Deparatamento com o ID '${id}' não encontrada.`);
    }
  }
}
