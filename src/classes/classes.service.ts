import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Class } from './entities/class.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ClassesService {

  constructor (
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Discipline)
    private readonly disciplineRepository: Repository<Discipline>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Criar nova Classe
   async create(createClassDto: CreateClassDto): Promise<Class> {
    const { disciplineId, teacherId, ...classData } = createClassDto;

    const discipline = await this.disciplineRepository.findOneBy({ id: disciplineId });
    if (!discipline) {
      throw new NotFoundException(`Disciplina com ID "${disciplineId}" não encontrada.`);
    }

    const newClass = this.classRepository.create({
      ...classData,
      discipline, 
    });

    return this.classRepository.save(newClass);
  }

  // Buscar todas as Classes
  findAll() : Promise<Class[]> {
    return this.classRepository.find();
  }

  // Buscar Classe por id
  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classRepository.findOneBy({ id });

    if(!classEntity){
      throw new NotFoundException(`Classe com o ID '${id}' não encontrada.`)
    }
    return classEntity;
  }

  //Atualizar Classe
  async update(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const classEntity = await this.classRepository.preload({ 
      id,
      ...updateClassDto,
    });

    if(!classEntity){
      throw new NotFoundException(`Classe com o ID '${id}' não encontrada.`)
    }

    return await this.classRepository.save(classEntity);
  }

  // Excluir Classe
  async remove(id: string): Promise<void> {
    const result = await this.classRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Classe com o ID '${id}' não encontrada.`);
    }
  }
}
