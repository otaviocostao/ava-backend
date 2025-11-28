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
import { TeacherSemesterAvailabilityShift } from './entities/teacher-semester-availability-shift.entity';
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
    @InjectRepository(TeacherSemesterAvailabilityShift)
    private readonly shiftRepository: Repository<TeacherSemesterAvailabilityShift>,
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

  private async getAcademicPeriodByIdOrPeriod(idOrPeriod: string): Promise<AcademicPeriod> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrPeriod);

    let academicPeriod: AcademicPeriod | null = null;

    if (isUUID) {
      academicPeriod = await this.academicPeriodRepository.findOne({
        where: { id: idOrPeriod },
      });
    } else {
      const periodPattern = /^\d{4}\.[12]$/;
      if (!periodPattern.test(idOrPeriod)) {
        throw new BadRequestException(
          `Formato de período inválido: "${idOrPeriod}". Use UUID ou formato YYYY.1/YYYY.2 (ex: "2026.2")`,
        );
      }

      academicPeriod = await this.academicPeriodRepository.findOne({
        where: { period: idOrPeriod },
      });
    }

    if (!academicPeriod) {
      throw new NotFoundException(
        `Período acadêmico "${idOrPeriod}" não encontrado.`,
      );
    }

    return academicPeriod;
  }

  private validateShifts(shifts: Array<{ dayOfWeek: string; shift: string }>): void {
    if (!shifts || shifts.length === 0) {
      throw new BadRequestException('Pelo menos um turno deve estar selecionado.');
    }

    const uniqueCombinations = new Set<string>();
    for (const shift of shifts) {
      const key = `${shift.dayOfWeek}-${shift.shift}`;
      if (uniqueCombinations.has(key)) {
        throw new BadRequestException(
          `Combinação duplicada: ${shift.shift} na ${shift.dayOfWeek}`,
        );
      }
      uniqueCombinations.add(key);
    }
  }

  private async getAvailabilityOrFail(id: string): Promise<TeacherSemesterAvailability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['teacher', 'academicPeriod', 'approvedBy', 'disciplines', 'shifts'],
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
    const { teacherId, academicPeriodId, status, shifts, observations, disciplineIds } = createDto;

    if (teacherId !== requestingUserId) {
      throw new ForbiddenException('Você só pode criar disponibilizações para si mesmo.');
    }

    const [teacher, academicPeriod] = await Promise.all([
      this.ensureTeacherExists(teacherId),
      this.ensureAcademicPeriodExists(academicPeriodId),
    ]);

    this.validateShifts(shifts);

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
      relations: ['shifts'],
    });

    if (existingAvailability) {
      if (existingAvailability.status === AvailabilityStatus.SUBMITTED || existingAvailability.status === AvailabilityStatus.APPROVED) {
        throw new ConflictException(
          `Já existe uma disponibilização ${existingAvailability.status} para este semestre. Não é possível criar uma nova.`,
        );
      }

      await this.shiftRepository.delete({ availability: { id: existingAvailability.id } });

      existingAvailability.status = finalStatus;
      existingAvailability.observations = observations || null;
      existingAvailability.disciplines = disciplines;

      if (finalStatus === AvailabilityStatus.SUBMITTED) {
        existingAvailability.submittedAt = new Date();
      }

      const savedAvailability = await this.availabilityRepository.save(existingAvailability);

      const shiftEntities = shifts.map((shift) =>
        this.shiftRepository.create({
          availability: savedAvailability,
          dayOfWeek: shift.dayOfWeek,
          shift: shift.shift,
        }),
      );

      await this.shiftRepository.save(shiftEntities);

      return this.getAvailabilityOrFail(savedAvailability.id);
    }

    const availability = this.availabilityRepository.create({
      teacher,
      academicPeriod,
      status: finalStatus,
      observations: observations || null,
      submittedAt: finalStatus === AvailabilityStatus.SUBMITTED ? new Date() : null,
      disciplines,
    });

    const savedAvailability = await this.availabilityRepository.save(availability);

    const shiftEntities = shifts.map((shift) =>
      this.shiftRepository.create({
        availability: savedAvailability,
        dayOfWeek: shift.dayOfWeek,
        shift: shift.shift,
      }),
    );

    await this.shiftRepository.save(shiftEntities);

    return this.getAvailabilityOrFail(savedAvailability.id);
  }

  async findAllByTeacher(teacherId: string): Promise<TeacherSemesterAvailability[]> {
    await this.ensureTeacherExists(teacherId);

    return this.availabilityRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['academicPeriod', 'approvedBy', 'disciplines', 'shifts'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByTeacherAndSemester(
    teacherId: string,
    semesterId: string,
  ): Promise<TeacherSemesterAvailability | null> {
    await this.ensureTeacherExists(teacherId);
    const academicPeriod = await this.getAcademicPeriodByIdOrPeriod(semesterId);

    return this.availabilityRepository.findOne({
      where: {
        teacher: { id: teacherId },
        academicPeriod: { id: academicPeriod.id },
      },
      relations: ['academicPeriod', 'approvedBy', 'disciplines', 'shifts'],
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

    if (updateDto.observations !== undefined) {
      availability.observations = updateDto.observations || null;
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

    if (updateDto.shifts !== undefined) {
      this.validateShifts(updateDto.shifts);

      await this.shiftRepository.delete({ availability: { id: availability.id } });

      const shiftEntities = updateDto.shifts.map((shift) =>
        this.shiftRepository.create({
          availability,
          dayOfWeek: shift.dayOfWeek,
          shift: shift.shift,
        }),
      );

      await this.shiftRepository.save(shiftEntities);
    }

    const savedAvailability = await this.availabilityRepository.save(availability);

    return this.getAvailabilityOrFail(savedAvailability.id);
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

    const savedAvailability = await this.availabilityRepository.save(availability);

    return this.getAvailabilityOrFail(savedAvailability.id);
  }

  async findPending(): Promise<TeacherSemesterAvailability[]> {
    return this.availabilityRepository.find({
      where: { status: AvailabilityStatus.SUBMITTED },
      relations: ['teacher', 'academicPeriod', 'disciplines', 'shifts'],
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

    const academicPeriod = await this.getAcademicPeriodByIdOrPeriod(semesterId);

    const teacherCourses = await this.teacherCourseRepository.find({
      where: { course: { id: courseId } },
      relations: ['teacher'],
    });

    const teacherIds = teacherCourses.map((tc) => tc.teacher.id);

    const availabilities = await this.availabilityRepository.find({
      where: {
        teacher: { id: In(teacherIds) },
        academicPeriod: { id: academicPeriod.id },
      },
      relations: ['teacher', 'academicPeriod', 'disciplines', 'shifts'],
      order: { teacher: { name: 'ASC' } },
    });

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      academicPeriod: {
        id: academicPeriod.id,
        period: academicPeriod.period,
      },
      teachers: availabilities.map((av) => ({
        id: av.teacher.id,
        name: av.teacher.name,
        email: av.teacher.email,
        shifts: (av.shifts || []).map((shift) => ({
          dayOfWeek: shift.dayOfWeek,
          shift: shift.shift,
        })),
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

