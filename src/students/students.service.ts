import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Attendance } from '../attendances/entities/attendance.entity';
import { Activity } from '../activities/entities/activity.entity';
import { ActivitySubmission } from '../activities/entities/activity-submission.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

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

    const grades = await this.gradesRepository
      .createQueryBuilder('grade')
      .innerJoin('grade.enrollment', 'enrollment')
      .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
      .orderBy('grade.gradedAt', 'DESC')
      .addOrderBy('grade.id', 'DESC')
      .take(limit)
      .getMany();

    if (grades.length === 0) {
      return [];
    }

    const activityIds = grades.map((g) => g.activityId);
    const activities =
      activityIds.length > 0
        ? await this.activityRepository
            .createQueryBuilder('activity')
            .innerJoinAndSelect('activity.class', 'class')
            .innerJoinAndSelect('class.discipline', 'discipline')
            .where('activity.id IN (:...activityIds)', { activityIds })
            .getMany()
        : [];

    const enrollmentMap = new Map(enrollments.map((e) => [e.id, e]));

    return grades.map((grade) => {
      const activity = activities.find((a) => a.id === grade.activityId);
      const enrollment = enrollmentMap.get(grade.enrollment.id);

      return {
        id: grade.id,
        activityTitle: activity?.title || '',
        disciplineName: enrollment?.class.discipline?.name || activity?.class?.discipline?.name || '',
        score: Number(grade.score),
        maxScore: activity?.max_score ? Number(activity.max_score) : null,
        gradedAt: grade.gradedAt ?? null,
      };
    }) as RecentGrade[];
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

    const activityIds = grades.map((g) => g.activityId);
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
      const activity = activities.find((a) => a.id === gradeWithBest.activityId);
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
}

