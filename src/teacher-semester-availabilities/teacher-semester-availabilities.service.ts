import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TeacherSemesterAvailability } from './entities/teacher-semester-availability.entity';
import { CreateTeacherSemesterAvailabilityDto } from './dto/create-teacher-semester-availability.dto';
import { UpdateTeacherSemesterAvailabilityDto } from './dto/update-teacher-semester-availability.dto';
import { User } from 'src/users/entities/user.entity';
import { AcademicPeriod } from 'src/academic-periods/entities/academic-period.entity';
import { AvailabilityStatus } from 'src/common/enums/availability-status.enum';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { TeacherCourse } from 'src/teacher-courses/entities/teacher-course.entity';
import { CourseDiscipline } from 'src/courses/entities/course-discipline.entity';
import { Course } from 'src/courses/entities/course.entity';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class TeacherSemesterAvailabilitiesService {
  constructor(
    @InjectRepository(TeacherSemesterAvailability)
    private readonly availabilityRepository: Repository<TeacherSemesterAvailability>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AcademicPeriod)
    private readonly academicPeriodRepository: Repository<AcademicPeriod>,
    @InjectRepository(Discipline)
    private readonly disciplineRepository: Repository<Discipline>,
    @InjectRepository(TeacherCourse)
    private readonly teacherCourseRepository: Repository<TeacherCourse>,
    @InjectRepository(CourseDiscipline)
    private readonly courseDisciplineRepository: Repository<CourseDiscipline>,
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

  private async ensureAcademicPeriodExists(academicPeriodId: string): Promise<AcademicPeriod> {
    const academicPeriod = await this.academicPeriodRepository.findOne({
      where: { id: academicPeriodId },
    });

    if (!academicPeriod) {
      throw new NotFoundException(`Período acadêmico com ID "${academicPeriodId}" não encontrado.`);
    }

    return academicPeriod;
  }

  private validateAtLeastOneShift(morning: boolean, afternoon: boolean, evening: boolean): void {
    if (!morning && !afternoon && !evening) {
      throw new BadRequestException('Pelo menos um turno deve estar selecionado (manhã, tarde ou noite).');
    }
  }

  private async getAvailabilityOrFail(id: string): Promise<TeacherSemesterAvailability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['teacher', 'academicPeriod', 'approvedBy', 'disciplines'],
    });

    if (!availability) {
      throw new NotFoundException(`Disponibilização com ID "${id}" não encontrada.`);
    }

    return availability;
  }

  private async validateDisciplinesBelongToTeacherCourses(
    teacherId: string,
    disciplineIds: string[],
  ): Promise<Discipline[]> {
    if (!disciplineIds || disciplineIds.length === 0) {
      return [];
    }

    const teacherCourses = await this.teacherCourseRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['course'],
    });

    if (teacherCourses.length === 0) {
      throw new BadRequestException(
        'Professor não está vinculado a nenhum curso. Entre em contato com o coordenador.',
      );
    }

    const courseIds = teacherCourses.map((tc) => tc.course.id);

    const courseDisciplines = await this.courseDisciplineRepository.find({
      where: {
        course: { id: In(courseIds) },
        discipline: { id: In(disciplineIds) },
      },
      relations: ['discipline'],
    });

    const validDisciplineIds = new Set(
      courseDisciplines.map((cd) => cd.discipline.id),
    );

    const invalidDisciplineIds = disciplineIds.filter(
      (id) => !validDisciplineIds.has(id),
    );

    if (invalidDisciplineIds.length > 0) {
      throw new BadRequestException(
        `As seguintes disciplinas não pertencem aos cursos do professor: ${invalidDisciplineIds.join(', ')}`,
      );
    }

    const disciplines = await this.disciplineRepository.find({
      where: { id: In(disciplineIds) },
    });

    return disciplines;
  }

  async create(
    createDto: CreateTeacherSemesterAvailabilityDto,
    requestingUserId: string,
  ): Promise<TeacherSemesterAvailability> {
    const { teacherId, academicPeriodId, status, morning, afternoon, evening, observations, disciplineIds, weekdays } = createDto;

    if (teacherId !== requestingUserId) {
      throw new ForbiddenException('Você só pode criar disponibilizações para si mesmo.');
    }

    const [teacher, academicPeriod] = await Promise.all([
      this.ensureTeacherExists(teacherId),
      this.ensureAcademicPeriodExists(academicPeriodId),
    ]);

    this.validateAtLeastOneShift(morning, afternoon, evening);

    const now = new Date();
    if (academicPeriod.startDate && academicPeriod.startDate <= now) {
      throw new BadRequestException('Apenas semestres futuros podem ser selecionados.');
    }

    const disciplines = await this.validateDisciplinesBelongToTeacherCourses(
      teacherId,
      disciplineIds || [],
    );

    const finalStatus = status || AvailabilityStatus.DRAFT;

    const existingAvailability = await this.availabilityRepository.findOne({
      where: {
        teacher: { id: teacherId },
        academicPeriod: { id: academicPeriodId },
      },
    });

    if (existingAvailability) {
      if (existingAvailability.status === AvailabilityStatus.SUBMITTED || existingAvailability.status === AvailabilityStatus.APPROVED) {
        throw new ConflictException(
          `Já existe uma disponibilização ${existingAvailability.status} para este semestre. Não é possível criar uma nova.`,
        );
      }

      existingAvailability.status = finalStatus;
      existingAvailability.morning = morning;
      existingAvailability.afternoon = afternoon;
      existingAvailability.evening = evening;
      existingAvailability.observations = observations || null;
      existingAvailability.disciplines = disciplines;
      existingAvailability.weekdays = weekdays || [];

      if (finalStatus === AvailabilityStatus.SUBMITTED) {
        existingAvailability.submittedAt = new Date();
      }

      return this.availabilityRepository.save(existingAvailability);
    }

    const availability = this.availabilityRepository.create({
      teacher,
      academicPeriod,
      status: finalStatus,
      morning,
      afternoon,
      evening,
      observations: observations || null,
      submittedAt: finalStatus === AvailabilityStatus.SUBMITTED ? new Date() : null,
      disciplines,
      weekdays: weekdays || [],
    });

    return this.availabilityRepository.save(availability);
  }

  async findAllByTeacher(teacherId: string): Promise<TeacherSemesterAvailability[]> {
    await this.ensureTeacherExists(teacherId);

    return this.availabilityRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['academicPeriod', 'approvedBy', 'disciplines'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByTeacherAndSemester(
    teacherId: string,
    semesterId: string,
  ): Promise<TeacherSemesterAvailability | null> {
    await this.ensureTeacherExists(teacherId);
    await this.ensureAcademicPeriodExists(semesterId);

    return this.availabilityRepository.findOne({
      where: {
        teacher: { id: teacherId },
        academicPeriod: { id: semesterId },
      },
      relations: ['academicPeriod', 'approvedBy', 'disciplines'],
    });
  }

  async findOne(id: string): Promise<TeacherSemesterAvailability> {
    return this.getAvailabilityOrFail(id);
  }

  async update(
    id: string,
    updateDto: UpdateTeacherSemesterAvailabilityDto,
    requestingUserId: string,
  ): Promise<TeacherSemesterAvailability> {
    const availability = await this.getAvailabilityOrFail(id);

    if (availability.teacher.id !== requestingUserId) {
      throw new ForbiddenException('Você só pode editar suas próprias disponibilizações.');
    }

    if (availability.status === AvailabilityStatus.APPROVED) {
      throw new BadRequestException('Não é possível editar uma disponibilização já aprovada.');
    }

    if (updateDto.academicPeriodId && updateDto.academicPeriodId !== availability.academicPeriod.id) {
      const newAcademicPeriod = await this.ensureAcademicPeriodExists(updateDto.academicPeriodId);

      const now = new Date();
      if (newAcademicPeriod.startDate && newAcademicPeriod.startDate <= now) {
        throw new BadRequestException('Apenas semestres futuros podem ser selecionados.');
      }

      const existingForNewPeriod = await this.availabilityRepository.findOne({
        where: {
          teacher: { id: availability.teacher.id },
          academicPeriod: { id: updateDto.academicPeriodId },
        },
      });

      if (existingForNewPeriod && existingForNewPeriod.id !== id) {
        throw new ConflictException('Já existe uma disponibilização para este semestre.');
      }

      availability.academicPeriod = newAcademicPeriod;
    }

    const morning = updateDto.morning ?? availability.morning;
    const afternoon = updateDto.afternoon ?? availability.afternoon;
    const evening = updateDto.evening ?? availability.evening;

    this.validateAtLeastOneShift(morning, afternoon, evening);

    availability.morning = morning;
    availability.afternoon = afternoon;
    availability.evening = evening;

    if (updateDto.observations !== undefined) {
      availability.observations = updateDto.observations || null;
    }

    if (updateDto.weekdays !== undefined) {
      availability.weekdays = updateDto.weekdays;
    }

    if (updateDto.status !== undefined) {
      if (updateDto.status === AvailabilityStatus.SUBMITTED && availability.status === AvailabilityStatus.DRAFT) {
        availability.submittedAt = new Date();
      }
      availability.status = updateDto.status;
    }

    if (updateDto.disciplineIds !== undefined) {
      const disciplines = await this.validateDisciplinesBelongToTeacherCourses(
        availability.teacher.id,
        updateDto.disciplineIds,
      );
      availability.disciplines = disciplines;
    }

    return this.availabilityRepository.save(availability);
  }

  async approve(
    id: string,
    coordinatorId: string,
  ): Promise<TeacherSemesterAvailability> {
    const availability = await this.getAvailabilityOrFail(id);

    if (availability.status !== AvailabilityStatus.SUBMITTED) {
      throw new BadRequestException(
        `Apenas disponibilizações com status 'submitted' podem ser aprovadas. Status atual: ${availability.status}`,
      );
    }

    const coordinator = await this.userRepository.findOne({
      where: { id: coordinatorId },
      relations: ['roles'],
    });

    if (!coordinator) {
      throw new NotFoundException(`Coordenador com ID "${coordinatorId}" não encontrado.`);
    }

    const hasCoordinatorRole = coordinator.roles.some((role) => role.name === 'coordinator');
    if (!hasCoordinatorRole) {
      throw new BadRequestException(`Usuário com ID "${coordinatorId}" não possui a role 'coordinator'.`);
    }

    availability.status = AvailabilityStatus.APPROVED;
    availability.approvedAt = new Date();
    availability.approvedBy = coordinator;

    return this.availabilityRepository.save(availability);
  }

  async findPending(): Promise<TeacherSemesterAvailability[]> {
    return this.availabilityRepository.find({
      where: { status: AvailabilityStatus.SUBMITTED },
      relations: ['teacher', 'academicPeriod', 'disciplines'],
      order: { submittedAt: 'ASC' },
    });
  }

  async findAvailableSemestersForTeacher(teacherId: string): Promise<AcademicPeriod[]> {
    await this.ensureTeacherExists(teacherId);

    const now = new Date();

    return this.academicPeriodRepository
      .createQueryBuilder('period')
      .where('period.startDate > :now', { now })
      .orderBy('period.startDate', 'ASC')
      .getMany();
  }

  async findSummaryByCourseAndSemester(
    courseId: string,
    semesterId: string,
    coordinatorId: string,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['department', 'department.coordinator'],
    });

    if (!course) {
      throw new NotFoundException(`Curso com ID "${courseId}" não encontrado.`);
    }

    if (!course.department || !course.department.coordinator) {
      throw new BadRequestException('Curso não está vinculado a um departamento com coordenador.');
    }

    if (course.department.coordinator.id !== coordinatorId) {
      throw new ForbiddenException('Você só pode visualizar cursos do seu departamento.');
    }

    await this.ensureAcademicPeriodExists(semesterId);

    const teacherCourses = await this.teacherCourseRepository.find({
      where: { course: { id: courseId } },
      relations: ['teacher'],
    });

    const teacherIds = teacherCourses.map((tc) => tc.teacher.id);

    const availabilities = await this.availabilityRepository.find({
      where: {
        teacher: { id: In(teacherIds) },
        academicPeriod: { id: semesterId },
      },
      relations: ['teacher', 'academicPeriod', 'disciplines'],
      order: { teacher: { name: 'ASC' } },
    });

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      academicPeriod: {
        id: semesterId,
        period: (await this.academicPeriodRepository.findOne({ where: { id: semesterId } }))?.period,
      },
      teachers: availabilities.map((av) => ({
        id: av.teacher.id,
        name: av.teacher.name,
        email: av.teacher.email,
        shifts: {
          morning: av.morning,
          afternoon: av.afternoon,
          evening: av.evening,
        },
        weekdays: av.weekdays || [],
        disciplines: av.disciplines.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
        })),
        status: av.status,
        observations: av.observations,
        submittedAt: av.submittedAt,
        approvedAt: av.approvedAt,
      })),
    };
  }
}

