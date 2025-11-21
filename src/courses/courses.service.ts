import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { Repository, In, Brackets } from 'typeorm';
import { Department } from 'src/departments/entities/department.entity';
import { StudentCourse } from 'src/student-courses/entities/student-course.entity';
import { Class } from 'src/classes/entities/class.entity';

@Injectable()
export class CoursesService {

  constructor (
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Discipline)
    private readonly disciplineRepository: Repository<Discipline>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(StudentCourse)
    private readonly studentCourseRepository: Repository<StudentCourse>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  // Criar novo Curso
  async create(createCourseDto: CreateCourseDto) {
    const normalizedCode = createCourseDto.code.toUpperCase();

    const existingByName = await this.courseRepository.findOneBy({
      name: createCourseDto.name,
    });

    if (existingByName) {
      throw new ConflictException('Já existe um curso com este nome.');
    }

    const existingByCode = await this.courseRepository.findOneBy({
      code: normalizedCode,
    });

    if (existingByCode) {
      throw new ConflictException('Já existe um curso com este código.');
    }

    // Validar e carregar Department obrigatório
    const department = await this.departmentRepository.findOne({ where: { id: createCourseDto.departmentId } });
    if (!department) {
      throw new NotFoundException(`Departamento com o ID '${createCourseDto.departmentId}' não encontrado.`);
    }

    const course = this.courseRepository.create({
      name: createCourseDto.name,
      code: normalizedCode,
      totalHours: createCourseDto.totalHours,
      durationSemesters: createCourseDto.durationSemesters,
      description: createCourseDto.description,
      status: createCourseDto.status,
      department,
      studentsCount: 0,
      classesCount: 0,
    });

    return await this.courseRepository.save(course);
  }

  // Buscar Cursos (opcionalmente filtrando por departamento) com contagens dinâmicas
  async findAll(filters: {
    departmentId?: string;
    status?: 'active' | 'inactive';
    search?: string;
  }): Promise<Course[]> {
    const query = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.department', 'department')
      .loadRelationCountAndMap('course.studentsCount', 'course.studentCourses')
      .loadRelationCountAndMap('course.disciplinesCount', 'course.disciplines');

    query.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(class.id)')
        .from(Class, 'class')
        .leftJoin('class.discipline', 'discipline')
        .leftJoin('discipline.courses', 'course_join')
        .where('course_join.id = course.id');
    }, 'course_classesCount');
    
    if (filters.departmentId) {
      query.andWhere('course.department.id = :departmentId', { departmentId: filters.departmentId });
    }
    
    if (filters.status) {
      query.andWhere('course.status = :status', { status: filters.status });
    }
    
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('course.name ILIKE :search', { search: searchTerm })
          .orWhere('course.code ILIKE :search', { search: searchTerm })
          .orWhere('department.name ILIKE :search', { search: searchTerm }); 
        }),
      );
    }
    
    const courses = await query.getMany();

    courses.forEach(course => {
      (course as any).classesCount = parseInt((course as any).course_classesCount, 10) || 0;
      delete (course as any).course_classesCount; 
    });

    return courses;
  }

  // Buscar Curso por id
  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['disciplines', 'department'],
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

  async findClasses(courseId: string): Promise<Class[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['disciplines'],
    });

    if (!course) {
      throw new NotFoundException(`Curso com o ID '${courseId}' nao encontrado.`);
    }

    const disciplineIds = (course.disciplines ?? []).map((discipline) => discipline.id);
    if (disciplineIds.length === 0) {
      return [];
    }

    return this.classRepository.find({
      where: { discipline: { id: In(disciplineIds) } },
      relations: ['discipline', 'teacher'],
      order: { code: 'ASC' },
    });
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
