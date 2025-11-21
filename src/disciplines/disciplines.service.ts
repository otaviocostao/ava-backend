import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Discipline } from './entities/discipline.entity';
import { ILike, In, Not, Repository } from 'typeorm';
import { Course } from 'src/courses/entities/course.entity';

@Injectable()
export class DisciplinesService {

  constructor (
    @InjectRepository(Discipline)
    private readonly disciplineRepository: Repository<Discipline>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  // Criar nova Disciplina
  async create(createDisciplineDto: CreateDisciplineDto) {
    const existingDiscipline = await this.disciplineRepository.findOne({
      where: { name: ILike(createDisciplineDto.name) },
    })

    if(existingDiscipline){
      throw new ConflictException('Esta Disciplina já foi criada.')
    }

    // Validar e carregar cursos obrigatórios
    const { courseIds } = createDisciplineDto;
    if (!courseIds || courseIds.length === 0) {
      throw new BadRequestException('É obrigatório informar ao menos um courseId.');
    }

    const courses = await this.courseRepository.find({
      where: { id: In(courseIds) },
    });

    if (courses.length !== courseIds.length) {
      throw new NotFoundException('Um ou mais courseIds não foram encontrados.');
    }

    const discipline = this.disciplineRepository.create({
      name: createDisciplineDto.name,
      credits: createDisciplineDto.credits,
      workLoad: createDisciplineDto.workload,
      courses,
    });

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
    if (updateDisciplineDto.name) {
      const conflict = await this.disciplineRepository.findOne({
        where: {
          name: ILike(updateDisciplineDto.name),
          id: Not(id),
        },
      });
      if (conflict) {
        throw new ConflictException('Já existe uma disciplina com este nome.');
      }
    }
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
