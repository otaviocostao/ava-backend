import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { Repository, In } from 'typeorm';
import { Department } from 'src/departments/entities/department.entity';
import { StudentCourse } from 'src/student-courses/entities/student-course.entity';

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
  async findAll(departmentId?: string) : Promise<Course[]> {
    const where = departmentId ? { department: { id: departmentId } } : {};
    const courses = await this.courseRepository.find({
      where,
      relations: ['disciplines'],
    });

    if (courses.length === 0) return courses;

    const ids = courses.map(c => c.id);

    // Alunos por curso (student_courses)
    const srows = await this.studentCourseRepository.createQueryBuilder('sc')
      .select('sc.course_id', 'courseId')
      .addSelect('COUNT(sc.id)', 'count')
      .where('sc.course_id IN (:...ids)', { ids })
      .groupBy('sc.course_id')
      .getRawMany<{ courseId: string; count: string }>();

    const countStudentsMap = Object.fromEntries(srows.map(r => [r.courseId, Number(r.count || 0)]));

    // Disciplinas por curso (courses_disciplines)
    const drows = await this.courseRepository.manager
      .createQueryBuilder()
      .select('cd.course_id', 'courseId')
      .addSelect('COUNT(cd.discipline_id)', 'count')
      .from('courses_disciplines', 'cd')
      .where('cd.course_id IN (:...ids)', { ids })
      .groupBy('cd.course_id')
      .getRawMany<{ courseId: string; count: string }>();

    const countDisciplinesMap = Object.fromEntries(drows.map(r => [r.courseId, Number(r.count || 0)]));

    // Turmas por curso (classes -> disciplines -> courses_disciplines)
    const crows = await this.courseRepository.manager
      .createQueryBuilder()
      .select('cd.course_id', 'courseId')
      .addSelect('COUNT(c.id)', 'count')
      .from('classes', 'c')
      .innerJoin('disciplines', 'd', 'c.discipline_id = d.id')
      .innerJoin('courses_disciplines', 'cd', 'cd.discipline_id = d.id')
      .where('cd.course_id IN (:...ids)', { ids })
      .groupBy('cd.course_id')
      .getRawMany<{ courseId: string; count: string }>();

    const countClassesMap = Object.fromEntries(crows.map(r => [r.courseId, Number(r.count || 0)]));

    for (const c of courses) {
      (c as any).studentsCount = countStudentsMap[c.id] ?? 0;
      (c as any).classesCount = countClassesMap[c.id] ?? 0;
      (c as any).disciplinesCount = countDisciplinesMap[c.id] ?? 0;
    }

    return courses;
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
