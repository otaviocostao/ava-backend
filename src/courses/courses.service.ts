import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CoursesService {

  constructor (
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>
  ) {}

  // Criar novo Curso
  async create(createCourseDto: CreateCourseDto) {
    const existingCourse = await this.courseRepository.findOneBy({
      name: createCourseDto.name,
    })

    if(existingCourse){
      throw new ConflictException('Este Curso já foi criado.')
    }

    const course = this.courseRepository.create(createCourseDto);

    return await this.courseRepository.save(course);
  }

  // Buscar todas as Curso
  findAll() : Promise<Course[]> {

    return this.courseRepository.find();
  }

  // Buscar Curso por id
  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOneBy({ id });

    if(!course){
      throw new NotFoundException(`Curso com o ID '${id}' não encontrado.`)
    }
    return course;
  }

  //Atualizar Curso
  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.courseRepository.preload({ 
      id,
      ...updateCourseDto,
    });

    if(!course){
      throw new NotFoundException(`Curso com o ID '${id}' não encontrado.`)
    }

    return await this.courseRepository.save(course);
  }

  // Excluir Course
  async remove(id: string): Promise<void> {
    const result = await this.courseRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Deparatamento com o ID '${id}' não encontrado.`);
    }
  }
}
