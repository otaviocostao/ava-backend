import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { CourseDiscipline } from './entities/course-discipline.entity';
import { CourseDisciplineStatus } from 'src/common/enums/course-discipline-status.enum';
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
    @InjectRepository(CourseDiscipline)
    private readonly courseDisciplineRepository: Repository<CourseDiscipline>,
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
      .loadRelationCountAndMap('course.disciplinesCount', 'course.courseDisciplines');

    query.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(class.id)')
        .from(Class, 'class')
        .leftJoin('class.discipline', 'discipline')
        .leftJoin('discipline.courseDisciplines', 'course_discipline')
        .where('course_discipline.course.id = course.id');
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
      relations: ['courseDisciplines', 'courseDisciplines.discipline', 'department'],
    });

    if(!course){
      throw new NotFoundException(`Curso com o ID '${id}' não encontrado.`)
    }

    // Mapear courseDisciplines para disciplinas com status e semestre
    (course as any).disciplines = (course.courseDisciplines || []).map((cd) => ({
      ...cd.discipline,
      status: cd.status,
      semester: cd.semester,
    }));

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
      relations: ['courseDisciplines', 'courseDisciplines.discipline'],
    });

    if (!course) {
      throw new NotFoundException(`Curso com o ID '${courseId}' nao encontrado.`);
    }

    const disciplineIds = (course.courseDisciplines ?? [])
      .filter((cd) => cd.status === CourseDisciplineStatus.ACTIVE)
      .map((cd) => cd.discipline.id);
    
    if (disciplineIds.length === 0) {
      return [];
    }

    return this.classRepository.find({
      where: { discipline: { id: In(disciplineIds) } },
      relations: ['discipline', 'teacher'],
      order: { code: 'ASC' },
    });
  }
  async associateDiscipline(courseId: string, disciplineId: string, semester?: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Curso com o ID '${courseId}' nao encontrado.`);
    }

    const discipline = await this.disciplineRepository.findOne({
      where: { id: disciplineId },
    });

    if (!discipline) {
      throw new NotFoundException(`Disciplina com o ID '${disciplineId}' nao encontrada.`);
    }

    const existing = await this.courseDisciplineRepository.findOne({
      where: { course: { id: courseId }, discipline: { id: disciplineId } },
    });

    if (existing) {
      throw new ConflictException('A disciplina ja esta associada a este curso.');
    }

    const courseDiscipline = this.courseDisciplineRepository.create({
      course,
      discipline,
      status: CourseDisciplineStatus.ACTIVE,
      semester: semester ?? undefined,
    });

    await this.courseDisciplineRepository.save(courseDiscipline);

    return this.findOne(courseId);
  }

  async dissociateDiscipline(courseId: string, disciplineId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Curso com o ID '${courseId}' nao encontrado.`);
    }

    const courseDiscipline = await this.courseDisciplineRepository.findOne({
      where: { course: { id: courseId }, discipline: { id: disciplineId } },
    });

    if (!courseDiscipline) {
      // Nada a fazer; manter resposta coerente retornando o curso atual
      return this.findOne(courseId);
    }

    await this.courseDisciplineRepository.remove(courseDiscipline);

    return this.findOne(courseId);
  }

  async toggleDisciplineStatus(
    courseId: string,
    disciplineId: string,
    status: CourseDisciplineStatus,
  ): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Curso com o ID '${courseId}' nao encontrado.`);
    }

    const courseDiscipline = await this.courseDisciplineRepository.findOne({
      where: { course: { id: courseId }, discipline: { id: disciplineId } },
    });

    if (!courseDiscipline) {
      throw new NotFoundException(
        `A disciplina com o ID '${disciplineId}' nao esta associada ao curso '${courseId}'.`,
      );
    }

    courseDiscipline.status = status;
    await this.courseDisciplineRepository.save(courseDiscipline);

    return this.findOne(courseId);
  }

  async updateDisciplineSemester(
    courseId: string,
    disciplineId: string,
    semester?: number,
  ): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Curso com o ID '${courseId}' nao encontrado.`);
    }

    const courseDiscipline = await this.courseDisciplineRepository.findOne({
      where: { course: { id: courseId }, discipline: { id: disciplineId } },
    });

    if (!courseDiscipline) {
      throw new NotFoundException(
        `A disciplina com o ID '${disciplineId}' nao esta associada ao curso '${courseId}'.`,
      );
    }

    courseDiscipline.semester = semester ?? null;
    await this.courseDisciplineRepository.save(courseDiscipline);

    return this.findOne(courseId);
  }
}
