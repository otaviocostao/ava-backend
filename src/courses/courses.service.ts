import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { Repository } from 'typeorm';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class CoursesService {

  constructor (
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Discipline)
    private readonly disciplineRepository: Repository<Discipline>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  // Criar novo Curso
  async create(createCourseDto: CreateCourseDto) {
    const existingCourse = await this.courseRepository.findOneBy({
      name: createCourseDto.name,
    })

    if(existingCourse){
      throw new ConflictException('Este Curso já foi criado.')
    }
    // Validar e carregar Department obrigatório
    const department = await this.departmentRepository.findOne({ where: { id: createCourseDto.departmentId } });
    if (!department) {
      throw new NotFoundException(`Departamento com o ID '${createCourseDto.departmentId}' não encontrado.`);
    }

    const course = this.courseRepository.create({
      name: createCourseDto.name,
      status: createCourseDto.status,
      department,
    });

    return await this.courseRepository.save(course);
  }

  // Buscar todas as Curso
  findAll() : Promise<Course[]> {
    return this.courseRepository.find({
      relations: ['disciplines'],
    });
  }

  // Buscar Curso por id
  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['disciplines'],
    });

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
  async associateDiscipline(courseId: string, disciplineId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['disciplines'],
    });

    if (!course) {
      throw new NotFoundException(`Curso com o ID '${courseId}' nao encontrado.`);
    }

    const discipline = await this.disciplineRepository.findOne({
      where: { id: disciplineId },
      relations: { courses: true },
    });

    if (!discipline) {
      throw new NotFoundException(`Disciplina com o ID '${disciplineId}' nao encontrada.`);
    }

    const alreadyLinked = (course.disciplines ?? []).some((d) => d.id === discipline.id);
    if (alreadyLinked) {
      throw new ConflictException('A disciplina ja esta associada a este curso.');
    }

    course.disciplines = [...(course.disciplines ?? []), discipline];
    await this.courseRepository.save(course);

    return (await this.courseRepository.findOne({
      where: { id: course.id },
      relations: ['disciplines'],
    })) as Course;
  }

  async dissociateDiscipline(courseId: string, disciplineId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['disciplines'],
    });

    if (!course) {
      throw new NotFoundException(`Curso com o ID '${courseId}' nao encontrado.`);
    }

    const discipline = await this.disciplineRepository.findOne({
      where: { id: disciplineId },
      relations: { courses: true },
    });

    if (!discipline) {
      throw new NotFoundException(`Disciplina com o ID '${disciplineId}' nao encontrada.`);
    }

    const existsInCourse = (course.disciplines ?? []).some(d => d.id === disciplineId);
    if (!existsInCourse) {
      // Nada a fazer; manter resposta coerente retornando o curso atual
      return course;
    }

    course.disciplines = (course.disciplines ?? []).filter(
      (current) => current.id !== disciplineId,
    );
    await this.courseRepository.save(course);

    return (await this.courseRepository.findOne({
      where: { id: course.id },
      relations: ['disciplines'],
    })) as Course;
  }
}
