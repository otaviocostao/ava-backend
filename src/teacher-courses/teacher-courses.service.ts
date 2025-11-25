import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherCourse } from './entities/teacher-course.entity';
import { CreateTeacherCourseDto } from './dto/create-teacher-course.dto';
import { User } from 'src/users/entities/user.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class TeacherCoursesService {
  constructor(
    @InjectRepository(TeacherCourse)
    private readonly teacherCourseRepository: Repository<TeacherCourse>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  private async ensureTeacherExists(teacherId: string): Promise<User> {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['roles'],
    });

    if (!teacher) {
      throw new NotFoundException(`Professor com ID "${teacherId}" não encontrado.`);
    }

    const hasTeacherRole = teacher.roles.some((role) => role.name === 'teacher');
    if (!hasTeacherRole) {
      throw new BadRequestException(`Usuário com ID "${teacherId}" não possui a role 'teacher'.`);
    }

    return teacher;
  }

  private async ensureCourseExists(courseId: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['department'],
    });

    if (!course) {
      throw new NotFoundException(`Curso com ID "${courseId}" não encontrado.`);
    }

    return course;
  }

  private async ensureCoordinatorCanManageCourse(
    coordinatorId: string,
    course: Course,
  ): Promise<void> {
    if (!course.department) {
      throw new BadRequestException('Curso não está vinculado a um departamento.');
    }

    const department = await this.departmentRepository.findOne({
      where: { id: course.department.id },
      relations: ['coordinator'],
    });

    if (!department) {
      throw new NotFoundException('Departamento do curso não encontrado.');
    }

    if (!department.coordinator || department.coordinator.id !== coordinatorId) {
      throw new ForbiddenException(
        'Você só pode gerenciar cursos do seu departamento.',
      );
    }
  }

  private async ensureCoordinatorCanManageTeacher(
    coordinatorId: string,
    teacherId: string,
  ): Promise<void> {
    const department = await this.departmentRepository
      .createQueryBuilder('department')
      .innerJoin('department.teachers', 'teacher')
      .where('department.coordinator.id = :coordinatorId', { coordinatorId })
      .andWhere('teacher.id = :teacherId', { teacherId })
      .getOne();

    if (!department) {
      throw new ForbiddenException(
        'Você só pode gerenciar professores do seu departamento.',
      );
    }
  }

  async create(
    createDto: CreateTeacherCourseDto,
    coordinatorId: string,
  ): Promise<TeacherCourse> {
    const { teacherId, courseId } = createDto;

    const [teacher, course] = await Promise.all([
      this.ensureTeacherExists(teacherId),
      this.ensureCourseExists(courseId),
    ]);

    await this.ensureCoordinatorCanManageCourse(coordinatorId, course);
    await this.ensureCoordinatorCanManageTeacher(coordinatorId, teacherId);

    const existing = await this.teacherCourseRepository.findOne({
      where: {
        teacher: { id: teacherId },
        course: { id: courseId },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Professor já está vinculado a este curso.',
      );
    }

    const teacherCourse = this.teacherCourseRepository.create({
      teacher,
      course,
    });

    return this.teacherCourseRepository.save(teacherCourse);
  }

  async findAllByTeacher(teacherId: string): Promise<TeacherCourse[]> {
    await this.ensureTeacherExists(teacherId);

    return this.teacherCourseRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['course', 'course.department'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByCourse(courseId: string): Promise<TeacherCourse[]> {
    await this.ensureCourseExists(courseId);

    return this.teacherCourseRepository.find({
      where: { course: { id: courseId } },
      relations: ['teacher', 'teacher.roles'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TeacherCourse> {
    const teacherCourse = await this.teacherCourseRepository.findOne({
      where: { id },
      relations: ['teacher', 'course', 'course.department'],
    });

    if (!teacherCourse) {
      throw new NotFoundException(`Vínculo professor-curso com ID "${id}" não encontrado.`);
    }

    return teacherCourse;
  }

  async remove(id: string, coordinatorId: string): Promise<void> {
    const teacherCourse = await this.findOne(id);

    await this.ensureCoordinatorCanManageCourse(coordinatorId, teacherCourse.course);
    await this.ensureCoordinatorCanManageTeacher(
      coordinatorId,
      teacherCourse.teacher.id,
    );

    const result = await this.teacherCourseRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Vínculo professor-curso com ID "${id}" não encontrado.`);
    }
  }
}

