import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Attendance } from '../attendances/entities/attendance.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivitySubmission } from '../activities/entities/activity-submission.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Class } from 'src/classes/entities/class.entity';
import { StudentCourse } from 'src/student-courses/entities/student-course.entity';
import { CourseDiscipline } from 'src/courses/entities/course-discipline.entity';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { CourseDisciplineType } from 'src/common/enums/course-discipline-type.enum';
import { StudentCurriculumDto, CurriculumDisciplineDto } from './dto/curriculum.dto';

export interface DashboardSummary {
  overallAttendance: number;
  overallAverage: number;
  pendingActivitiesCount: number;
}

export interface NextClass {
  id: string;
  code: string;
  disciplineName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  date: Date;
}

export interface RecentGrade {
  id: string;
  activityTitle: string;
  disciplineName: string;
  score: number;
  maxScore: number | null;
  gradedAt: Date | null;
}

export interface PendingActivitiesCount {
  pending: number;
  completed: number;
}

export interface PerformanceMetrics {
  overallAverage: number;
  bestGrade: number | null;
  bestGradeActivity: string | null;
  approvedDisciplines: number;
  totalDisciplines: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: Date | null;
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Grade)
    private readonly gradesRepository: Repository<Grade>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivitySubmission)
    private readonly activitySubmissionRepository: Repository<ActivitySubmission>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(StudentCourse)
    private readonly studentCourseRepository: Repository<StudentCourse>,
    @InjectRepository(CourseDiscipline)
    private readonly courseDisciplineRepository: Repository<CourseDiscipline>,
    @InjectRepository(Discipline)
    private readonly disciplineRepository: Repository<Discipline>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  private async ensureStudentExists(studentId: string): Promise<User> {
    const student = await this.userRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }
    return student;
  }

  async getDashboardSummary(studentId: string): Promise<DashboardSummary> {
    await this.ensureStudentExists(studentId);

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class'],
    });

    const enrollmentIds = enrollments.map((e) => e.id);

    const [allAttendances, grades, activities, submissions] = await Promise.all([
      enrollmentIds.length > 0
        ? this.attendanceRepository
            .createQueryBuilder('attendance')
            .innerJoin('attendance.enrollment', 'enrollment')
            .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
            .getMany()
        : [] as Attendance[],
      enrollmentIds.length > 0
        ? this.gradesRepository
            .createQueryBuilder('grade')
            .innerJoin('grade.enrollment', 'enrollment')
            .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
            .getMany()
        : [] as Grade[],
      enrollmentIds.length > 0
        ? this.activityRepository
            .createQueryBuilder('activity')
            .innerJoin('activity.class', 'class')
            .innerJoin('class.enrollments', 'enrollment')
            .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
            .getMany()
        : [] as Activity[],
      this.activitySubmissionRepository.find({
        where: { student: { id: studentId } },
        relations: ['activity'],
      }),
    ]);

    const totalAttendance = allAttendances.length;
    const presentCount = allAttendances.filter((a) => a.present).length;
    const overallAttendance = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    const totalGrades = grades.length;
    const sumGrades = grades.reduce((sum, g) => sum + Number(g.score), 0);
    const overallAverage = totalGrades > 0 ? sumGrades / totalGrades : 0;

    const completedActivityIds = submissions
      .filter((s) => s.status === 'completed')
      .map((s) => s.activity.id);
    const pendingActivitiesCount = activities.filter(
      (a) => !completedActivityIds.includes(a.id),
    ).length;

    return {
      overallAttendance: Math.round(overallAttendance * 100) / 100,
      overallAverage: Math.round(overallAverage * 100) / 100,
      pendingActivitiesCount,
    };
  }

  async getNextClasses(studentId: string): Promise<NextClass[]> {
    await this.ensureStudentExists(studentId);

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.discipline', 'class.schedules'],
    });

    const allSchedules: NextClass[] = [];
    const today = new Date();
    const currentDayOfWeek = today.getDay();

    for (const enrollment of enrollments) {
      const classSchedules = enrollment.class.schedules || [];
      for (const schedule of classSchedules) {
        const scheduleDay = this.getDayOfWeekNumber(schedule.dayOfWeek);
        const daysUntilNext = this.calculateDaysUntilNext(currentDayOfWeek, scheduleDay);
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntilNext);

        allSchedules.push({
          id: schedule.id,
          code: enrollment.class.code,
          disciplineName: enrollment.class.discipline?.name || '',
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room || null,
          date: nextDate,
        });
      }
    }

    return allSchedules
      .sort((a, b) => {
        if (a.date.getTime() !== b.date.getTime()) {
          return a.date.getTime() - b.date.getTime();
        }
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 5);
  }

  private getDayOfWeekNumber(dayOfWeek: string): number {
    const days: Record<string, number> = {
      'segunda-feira': 1,
      'terca-feira': 2,
      'quarta-feira': 3,
      'quinta-feira': 4,
      'sexta-feira': 5,
      'sabado': 6,
      'domingo': 0,
    };
    return days[dayOfWeek.toLowerCase()] ?? 0;
  }

  private calculateDaysUntilNext(currentDay: number, targetDay: number): number {
    if (targetDay >= currentDay) {
      return targetDay - currentDay;
    }
    return 7 - currentDay + targetDay;
  }

  async getRecentGrades(studentId: string, limit: number = 5): Promise<RecentGrade[]> {
    await this.ensureStudentExists(studentId);

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.discipline'],
    });

    const enrollmentIds = enrollments.map((e) => e.id);

    if (enrollmentIds.length === 0) {
      return [];
    }

    // Carrega as relações necessárias para evitar lookups adicionais e erros de IDs
    const grades = await this.gradesRepository
      .createQueryBuilder('grade')
      .innerJoinAndSelect('grade.activity', 'activity')
      .innerJoinAndSelect('grade.enrollment', 'enrollment')
      .innerJoinAndSelect('enrollment.class', 'class')
      .innerJoinAndSelect('class.discipline', 'discipline')
      .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
      .orderBy('grade.gradedAt', 'DESC')
      .addOrderBy('grade.id', 'DESC')
      .take(limit)
      .getMany();

    if (grades.length === 0) {
      return [];
    }

    return grades.map((grade) => {
      const activity = grade.activity;
      const enrollment = grade.enrollment;

      return {
        id: grade.id,
        activityTitle: activity?.title || '',
        disciplineName: enrollment?.class?.discipline?.name || '',
        score: Number(grade.score),
        maxScore: activity?.maxScore != null ? Number(activity.maxScore) : null,
        gradedAt: grade.gradedAt ?? null,
      } as RecentGrade;
    });
  }

  async getPendingActivitiesCount(studentId: string): Promise<PendingActivitiesCount> {
    await this.ensureStudentExists(studentId);

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class'],
    });

    const enrollmentIds = enrollments.map((e) => e.id);

    if (enrollmentIds.length === 0) {
      return { pending: 0, completed: 0 };
    }

    const [activities, submissions] = await Promise.all([
      this.activityRepository
        .createQueryBuilder('activity')
        .innerJoin('activity.class', 'class')
        .innerJoin('class.enrollments', 'enrollment')
        .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
        .getMany(),
      this.activitySubmissionRepository.find({
        where: { student: { id: studentId } },
        relations: ['activity'],
      }),
    ]);

    const completedActivityIds = submissions
      .filter((s) => s.status === 'completed')
      .map((s) => s.activity.id);

    const pending = activities.filter((a) => !completedActivityIds.includes(a.id)).length;
    const completed = completedActivityIds.length;

    return { pending, completed };
  }

  async getPerformanceMetrics(studentId: string): Promise<PerformanceMetrics> {
    await this.ensureStudentExists(studentId);

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.discipline'],
    });

    const enrollmentIds = enrollments.map((e) => e.id);

    if (enrollmentIds.length === 0) {
      return {
        overallAverage: 0,
        bestGrade: null,
        bestGradeActivity: null,
        approvedDisciplines: 0,
        totalDisciplines: 0,
      };
    }

    const grades = await this.gradesRepository
      .createQueryBuilder('grade')
      .innerJoin('grade.enrollment', 'enrollment')
      .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
      .getMany();

    const activityIds = grades.map((g) => g.activity);
    const activities =
      activityIds.length > 0
        ? await this.activityRepository
            .createQueryBuilder('activity')
            .where('activity.id IN (:...activityIds)', { activityIds })
            .getMany()
        : [];

    const totalGrades = grades.length;
    const sumGrades = grades.reduce((sum, g) => sum + Number(g.score), 0);
    const overallAverage = totalGrades > 0 ? sumGrades / totalGrades : 0;

    let bestGrade: number | null = null;
    let bestGradeActivity: string | null = null;

    if (grades.length > 0) {
      const gradeWithBest = grades.reduce((best, current) => {
        const currentScore = Number(current.score);
        const bestScore = best ? Number(best.score) : currentScore;
        return currentScore > bestScore ? current : best;
      });

      bestGrade = Number(gradeWithBest.score);
      const activity = activities.find((a) => a === gradeWithBest.activity);
      bestGradeActivity = activity?.title || null;
    }

    const MIN_APPROVAL_SCORE = 6.0;
    const approvedDisciplines = enrollments.filter((enrollment) => {
      const enrollmentGrades = grades.filter((g) => g.enrollment.id === enrollment.id);
      if (enrollmentGrades.length === 0) return false;
      const average =
        enrollmentGrades.reduce((sum, g) => sum + Number(g.score), 0) / enrollmentGrades.length;
      return average >= MIN_APPROVAL_SCORE;
    }).length;

    return {
      overallAverage: Math.round(overallAverage * 100) / 100,
      bestGrade,
      bestGradeActivity,
      approvedDisciplines,
      totalDisciplines: enrollments.length,
    };
  }

  async getAchievements(studentId: string): Promise<Achievement[]> {
    await this.ensureStudentExists(studentId);

    return [];
  }

  async getDisciplines(studentId: string) {
    await this.ensureStudentExists(studentId);

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.discipline', 'class.teacher'],
    });

    return enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      class: {
        id: enrollment.class.id,
        code: enrollment.class.code,
        semester: enrollment.class.semester,
        year: enrollment.class.year,
      },
      discipline: enrollment.class.discipline
        ? {
            id: enrollment.class.discipline.id,
            name: enrollment.class.discipline.name,
          }
        : null,
      teacher: enrollment.class.teacher
        ? {
            id: enrollment.class.teacher.id,
            name: enrollment.class.teacher.name,
            email: enrollment.class.teacher.email,
          }
        : null,
    }));
  }

  async findStudentClasses(studentId: string) {
    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: [
        'class',
        'class.discipline',
        'class.teacher',
      ],
      order: {
        class: {
          year: 'DESC',
          semester: 'DESC',
        }
      }
    });

    if (!enrollments || enrollments.length === 0) {
      return [];
    }
    
    return enrollments.map(enrollment => {
      const { class: studentClass } = enrollment;
      return {
        id: studentClass.id,
        code: studentClass.code,
        semester: studentClass.semester,
        year: studentClass.year,
        discipline: {
          id: studentClass.discipline.id,
          name: studentClass.discipline.name,
        },
        teacher: studentClass.teacher ? {
          id: studentClass.teacher.id,
          name: studentClass.teacher.name,
        } : null,
        progresso: Math.floor(Math.random() * 100),
        media: parseFloat((Math.random() * 10).toFixed(1)),
      };
    });
  }
  
  async getCompletedHours(studentId: string): Promise<number> {
    await this.ensureStudentExists(studentId);

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.discipline'],
    });

    const MIN_APPROVAL_SCORE = 6.0;
    let completedHours = 0;

    for (const enrollment of enrollments) {
      const grades = await this.gradesRepository
        .createQueryBuilder('grade')
        .where('grade.enrollment.id = :enrollmentId', { enrollmentId: enrollment.id })
        .getMany();

      if (grades.length > 0) {
        const average =
          grades.reduce((sum, g) => sum + Number(g.score), 0) / grades.length;

        if (average >= MIN_APPROVAL_SCORE && enrollment.class.discipline) {
          completedHours += enrollment.class.discipline.credits || 0;
        }
      }
    }

    return completedHours;
  }

  async getStudentCurriculum(studentId: string): Promise<StudentCurriculumDto> {
    await this.ensureStudentExists(studentId);

    // Busca o curso do aluno
    const studentCourse = await this.studentCourseRepository.findOne({
      where: { student: { id: studentId } },
      relations: ['course'],
    });

    if (!studentCourse || !studentCourse.course) {
      throw new NotFoundException(
        `Aluno com ID "${studentId}" não está vinculado a nenhum curso.`,
      );
    }

    const course = studentCourse.course;

    // Busca todas as disciplinas do curso
    const courseDisciplines = await this.courseDisciplineRepository.find({
      where: { course: { id: course.id } },
      relations: ['discipline'],
    });

    // Busca todos os enrollments do aluno
    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.discipline'],
    });

    // Busca todas as notas e presenças do aluno
    const enrollmentIds = enrollments.map((e) => e.id);
    const [allGrades, allAttendances] = await Promise.all([
      enrollmentIds.length > 0
        ? this.gradesRepository.find({
            where: { enrollment: { id: In(enrollmentIds) } },
            relations: ['enrollment', 'activity'],
          })
        : [],
      enrollmentIds.length > 0
        ? this.attendanceRepository.find({
            where: { enrollment: { id: In(enrollmentIds) } },
            relations: ['enrollment'],
          })
        : [],
    ]);

    // Cria mapas para facilitar busca
    const enrollmentsByDisciplineId = new Map<string, Enrollment[]>();
    enrollments.forEach((enrollment) => {
      const disciplineId = enrollment.class.discipline?.id;
      if (disciplineId) {
        if (!enrollmentsByDisciplineId.has(disciplineId)) {
          enrollmentsByDisciplineId.set(disciplineId, []);
        }
        enrollmentsByDisciplineId.get(disciplineId)!.push(enrollment);
      }
    });

    const gradesByEnrollmentId = new Map<string, Grade[]>();
    allGrades.forEach((grade) => {
      const enrollmentId = grade.enrollment.id;
      if (!gradesByEnrollmentId.has(enrollmentId)) {
        gradesByEnrollmentId.set(enrollmentId, []);
      }
      gradesByEnrollmentId.get(enrollmentId)!.push(grade);
    });

    const attendancesByEnrollmentId = new Map<string, Attendance[]>();
    allAttendances.forEach((attendance) => {
      const enrollmentId = attendance.enrollment.id;
      if (!attendancesByEnrollmentId.has(enrollmentId)) {
        attendancesByEnrollmentId.set(enrollmentId, []);
      }
      attendancesByEnrollmentId.get(enrollmentId)!.push(attendance);
    });

    // Determina o semestre atual (assumindo formato "YYYY.S" ou "YYYY-S")
    const getCurrentSemester = (): string => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const semester = month <= 6 ? 1 : 2;
      return `${year}.${semester}`;
    };

    const currentSemester = getCurrentSemester();
    const MIN_APPROVAL_SCORE = 6.0;
    const MIN_ATTENDANCE_PERCENTAGE = 75;

    // Função auxiliar para calcular status da disciplina
    const calculateDisciplineStatus = (
      disciplineId: string,
    ): {
      status: 'Aprovado' | 'Reprovado' | 'Cursando' | 'Pendente';
      finalGrade?: number;
      absences?: number;
      academicPeriod?: string;
    } => {
      const disciplineEnrollments = enrollmentsByDisciplineId.get(disciplineId) || [];

      if (disciplineEnrollments.length === 0) {
        return { status: 'Pendente' };
      }

      // Pega o enrollment mais recente
      const latestEnrollment = disciplineEnrollments.sort(
        (a, b) => (new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()),
      )[0];

      const classSemester = latestEnrollment.class.semester;
      const enrollmentGrades = gradesByEnrollmentId.get(latestEnrollment.id) || [];
      const enrollmentAttendances = attendancesByEnrollmentId.get(latestEnrollment.id) || [];

      // Calcula nota final (média das notas)
      const finalGrade =
        enrollmentGrades.length > 0
          ? enrollmentGrades.reduce((sum, g) => sum + Number(g.score), 0) / enrollmentGrades.length
          : undefined;

      // Calcula faltas (presenças onde present = false)
      const absences = enrollmentAttendances.filter((a) => !a.present).length;

      // Calcula porcentagem de presença
      const totalAttendances = enrollmentAttendances.length;
      const presentCount = enrollmentAttendances.filter((a) => a.present).length;
      const attendancePercentage =
        totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 100;

      // Determina se está cursando (semestre atual)
      const isCurrentSemester = classSemester === currentSemester || 
                                 classSemester === currentSemester.replace('.', '-');

      if (isCurrentSemester) {
        return { status: 'Cursando', finalGrade, absences, academicPeriod: classSemester };
      }

      // Disciplina finalizada - verifica aprovação
      if (
        finalGrade !== undefined &&
        finalGrade >= MIN_APPROVAL_SCORE &&
        attendancePercentage >= MIN_ATTENDANCE_PERCENTAGE
      ) {
        return { status: 'Aprovado', finalGrade, absences, academicPeriod: classSemester };
      } else {
        return { status: 'Reprovado', finalGrade, absences, academicPeriod: classSemester };
      }
    };

    // Mapeia disciplinas do curso
    const disciplines: (CurriculumDisciplineDto & { semester: number | string | null })[] = courseDisciplines.map((cd) => {
      const discipline = cd.discipline;
      const disciplineStatus = calculateDisciplineStatus(discipline.id);

      return {
        id: discipline.id,
        code: discipline.code || null,
        name: discipline.name,
        academicPeriod: disciplineStatus.academicPeriod || null,
        status: disciplineStatus.status,
        finalGrade: disciplineStatus.finalGrade,
        absences: disciplineStatus.absences,
        credits: discipline.credits || 0,
        workload: discipline.workLoad || 0,
        type: cd.type === CourseDisciplineType.REQUIRED ? 'required' : 'optional',
        semester: cd.semester || 'Sem semestre',
      };
    });

    // Agrupa por semestre
    const semesterMap = new Map<number | string, CurriculumDisciplineDto[]>();
    disciplines.forEach((discipline) => {
      const semester = discipline.semester || 'Sem semestre';
      if (!semesterMap.has(semester)) {
        semesterMap.set(semester, []);
      }
      // Remove a propriedade semester do objeto antes de adicionar ao mapa
      const { semester: _, ...disciplineDto } = discipline;
      semesterMap.get(semester)!.push(disciplineDto);
    });

    const semesters = Array.from(semesterMap.entries())
      .sort((a, b) => {
        // Ordena por semestre numérico ou alfabeticamente
        const aNum = typeof a[0] === 'number' ? a[0] : 999;
        const bNum = typeof b[0] === 'number' ? b[0] : 999;
        return aNum - bNum;
      })
      .map(([semester, disciplines]) => ({
        semester,
        disciplines,
      }));

    // Calcula resumo
    const requiredDisciplines = disciplines.filter((d) => d.type === 'required');
    const optionalDisciplines = disciplines.filter((d) => d.type === 'optional');

    const summary = {
      totalHours: disciplines.reduce((sum, d) => sum + d.workload, 0),
      completedHours: disciplines
        .filter((d) => d.status === 'Aprovado')
        .reduce((sum, d) => sum + d.workload, 0),
      requiredDisciplines: {
        completed: requiredDisciplines.filter((d) => d.status === 'Aprovado').length,
        total: requiredDisciplines.length,
      },
      optionalDisciplines: {
        completed: optionalDisciplines.filter((d) => d.status === 'Aprovado').length,
        total: optionalDisciplines.length,
      },
    };

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code || null,
      },
      summary,
      semesters,
    };
  }
}

