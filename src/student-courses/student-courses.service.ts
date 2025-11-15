import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentCourse } from './entities/student-course.entity';
import { CreateStudentCourseDto } from './dto/create-student-course.dto';
import { User } from 'src/users/entities/user.entity';
import { Course } from 'src/courses/entities/course.entity';
import { StudentCourseStatus } from 'src/common/enums/student-course-status.enum';

@Injectable()
export class StudentCoursesService {
  constructor(
    @InjectRepository(StudentCourse)
    private readonly studentCourseRepository: Repository<StudentCourse>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  private validateEntrySemesterFormat(entrySemester: string) {
    if (!/^\d{4}-(1|2)$/.test(entrySemester)) {
      throw new BadRequestException('entrySemester deve estar no formato YYYY-1|2');
    }
  }

  async create(dto: CreateStudentCourseDto): Promise<StudentCourse> {
    this.validateEntrySemesterFormat(dto.entrySemester);

    const [student, course] = await Promise.all([
      this.userRepository.findOne({ where: { id: dto.studentId } }),
      this.courseRepository.findOne({ where: { id: dto.courseId } }),
    ]);

    if (!student) throw new NotFoundException(`Aluno com ID '${dto.studentId}' não encontrado.`);
    if (!course) throw new NotFoundException(`Curso com ID '${dto.courseId}' não encontrado.`);

    const hasStudentRole = (student.roles || []).some(r => r.name === 'student');
    if (!hasStudentRole) {
      throw new BadRequestException('O usuário informado não possui a role "student".');
    }

    const existing = await this.studentCourseRepository.findOne({
      where: { student: { id: student.id }, course: { id: course.id } },
    });
    if (existing) {
      throw new ConflictException('Este aluno já está vinculado a este curso.');
    }

    const link = this.studentCourseRepository.create({
      student,
      course,
      entrySemester: dto.entrySemester,
      status: dto.status ?? StudentCourseStatus.ACTIVE,
    });
    const saved = await this.studentCourseRepository.save(link);

    await this.recalculateAndPersistCourseStudentsCount(course.id);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const link = await this.studentCourseRepository.findOne({ where: { id }, relations: ['course'] });
    if (!link) throw new NotFoundException(`Vínculo com ID '${id}' não encontrado.`);
    const courseId = link.course.id;
    await this.studentCourseRepository.delete(id);
    await this.recalculateAndPersistCourseStudentsCount(courseId);
  }

  async findStudentsByCourse(courseId: string): Promise<User[]> {
    const links = await this.studentCourseRepository.find({
      where: { course: { id: courseId } },
      relations: ['student'],
    });
    return links.map(l => l.student);
  }

  async findCoursesByStudent(studentId: string): Promise<Course[]> {
    const links = await this.studentCourseRepository.find({
      where: { student: { id: studentId } },
      relations: ['course'],
    });
    return links.map(l => l.course);
  }

  async recalculateAndPersistCourseStudentsCount(courseId: string): Promise<void> {
    const row = await this.studentCourseRepository.createQueryBuilder('sc')
      .select('COUNT(sc.id)', 'count')
      .where('sc.course_id = :courseId', { courseId })
      .getRawOne<{ count: string }>();

    const total = Number((row && row.count) ? row.count : 0);
    await this.courseRepository.update(courseId, { studentsCount: total });
  }
}


