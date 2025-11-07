import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Activity } from '../activities/entities/activity.entity';
import { Class } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { Attendance } from '../attendances/entities/attendance.entity';

interface FindGradesQuery {
  enrollmentId?: string;
  activityId?: string;
}

export interface ActivityGradebookEntry {
  enrollmentId: string;
  student: {
    id: string;
    name: string;
    email: string;
  } | null;
  grade: {
    id: string;
    score: number;
    gradedAt: Date | null;
  } | null;
}

export interface ActivityGradebook {
  activity: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    due_date: Date | null;
    max_score: number | null;
    classId: string;
  };
  entries: ActivityGradebookEntry[];
}

export interface StudentActivityGrade {
  id: string;
  title: string;
  description: string | null;
  type: string;
  due_date: Date | null;
  max_score: number | null;
  grade: {
    id: string;
    score: number;
    gradedAt: Date | null;
  } | null;
}

export interface StudentClassGrades {
  enrollmentId: string;
  class: {
    id: string;
    code: string;
    semester: string;
    year: number;
  };
  activities: StudentActivityGrade[];
}

export interface StudentGradebook {
  student: {
    id: string;
    name: string;
    email: string;
  };
  classes: StudentClassGrades[];
}

export interface ClassGradebookEntry {
  enrollmentId: string;
  student: {
    id: string;
    name: string;
    email: string;
  } | null;
  grades: {
    activityId: string;
    grade: {
      id: string;
      score: number;
      gradedAt: Date | null;
    } | null;
  }[];
}

export interface ClassGradebook {
  class: {
    id: string;
    code: string;
    semester: string;
    year: number;
    discipline: {
      id: string;
      name: string;
    } | null;
    teacher: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  activities: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    due_date: Date | null;
    max_score: number | null;
  }[];
  entries: ClassGradebookEntry[];
}

export interface DetailedGradeByDiscipline {
  enrollmentId: string;
  class: {
    id: string;
    code: string;
    semester: string;
    year: number;
    disciplineName: string;
  };
  average: number;
  attendancePercentage: number;
  status: 'approved' | 'reproved' | 'in_progress';
  gradesByPeriod: {
    period: string;
    activities: StudentActivityGrade[];
  }[];
}

export interface DetailedStudentGrades {
  student: {
    id: string;
    name: string;
    email: string;
  };
  disciplines: DetailedGradeByDiscipline[];
}

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradesRepository: Repository<Grade>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async create(createGradeDto: CreateGradeDto): Promise<Grade> {
    const enrollment = await this.findEnrollment(createGradeDto.enrollmentId);
    const activity = await this.activityRepository.findOneBy({
      id: createGradeDto.activityId,
    });

    if (!activity) {
      throw new NotFoundException(
        `Atividade com o ID '${createGradeDto.activityId}' nao encontrada.`,
      );
    }

    const existingGrade = await this.gradesRepository.findOne({
      where: {
        enrollment: { id: enrollment.id },
        activity: { id: activity.id },
      },
    });

    if (existingGrade) {
      throw new ConflictException(
        'Esta atividade ja recebeu nota para a matricula informada.',
      );
    }

    const grade = this.gradesRepository.create({
      enrollment,
      activity,
      score: createGradeDto.score,
      gradedAt: createGradeDto.gradedAt
        ? new Date(createGradeDto.gradedAt)
        : new Date(),
    });

    return this.gradesRepository.save(grade);
  }

  async getActivityGradebook(activityId: string): Promise<ActivityGradebook> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['class'],
    });

    if (!activity) {
      throw new NotFoundException(
        `Atividade com o ID '${activityId}' nao encontrada.`,
      );
    }

    if (!activity.class) {
      throw new NotFoundException(
        `A atividade informada nao esta vinculada a uma turma.`,
      );
    }

    const [enrollments, grades] = await Promise.all([
      this.enrollmentRepository.find({
        where: { class: { id: activity.class.id } },
        relations: ['student'],
      }),
      this.gradesRepository.find({
        where: { activity: { id: activityId } },
        relations: ['enrollment'],
      }),
    ]);

    const gradesByEnrollmentId = new Map(
      grades.map((grade) => [grade.enrollment.id, grade]),
    );

    const entries: ActivityGradebookEntry[] = enrollments.map((enrollment) => {
      const grade = gradesByEnrollmentId.get(enrollment.id);
      const student = enrollment.student;

      return {
        enrollmentId: enrollment.id,
        student: student
          ? {
              id: student.id,
              name: student.name,
              email: student.email,
            }
          : null,
        grade: grade
          ? {
              id: grade.id,
              score: Number(grade.score),
              gradedAt: grade.gradedAt ?? null,
            }
          : null,
      };
    });

    return {
      activity: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        type: activity.type,
        due_date: activity.dueDate ? new Date(activity.dueDate) : null,
        max_score: activity.maxScore !== null ? Number(activity.maxScore) : null,
        classId: activity.class.id,
      },
      entries,
    };
  }

  findAll(query: FindGradesQuery): Promise<Grade[]> {
    const where: any = {};

    if (query.enrollmentId) {
      where.enrollment = { id: query.enrollmentId };
    }

    if (query.activityId) {
      where.activity = { id: query.activityId };
    }

    return this.gradesRepository.find({
      where,
      relations: ['enrollment', 'activity'],
    });
  }

  async findOne(id: string): Promise<Grade> {
    const grade = await this.gradesRepository.findOne({
      where: { id },
      relations: ['enrollment', 'activity'],
    });

    if (!grade) {
      throw new NotFoundException(`Nota com o ID '${id}' nao encontrada.`);
    }

    return grade;
  }

  async update(id: string, updateGradeDto: UpdateGradeDto): Promise<Grade> {
    const grade = await this.findOne(id);

    if (updateGradeDto.enrollmentId) {
      grade.enrollment = await this.findEnrollment(updateGradeDto.enrollmentId);
    }

    if (
      updateGradeDto.activityId &&
      updateGradeDto.activityId !== grade.activity.id
    ) {
      const newActivity = await this.activityRepository.findOneBy({
        id: updateGradeDto.activityId,
      });
      if (!newActivity) {
        throw new NotFoundException(
          `Atividade com o ID '${updateGradeDto.activityId}' nao encontrada.`,
        );
      }

      const duplicate = await this.gradesRepository.findOne({
        where: {
          enrollment: { id: grade.enrollment.id },
          activity: { id: updateGradeDto.activityId },
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          'Esta atividade ja recebeu nota para a matricula informada.',
        );
      }
      grade.activity = newActivity;
    }

    if (updateGradeDto.score !== undefined) {
      grade.score = updateGradeDto.score;
    }

    if (updateGradeDto.gradedAt !== undefined) {
      grade.gradedAt = updateGradeDto.gradedAt
        ? new Date(updateGradeDto.gradedAt)
        : null;
    }

    return this.gradesRepository.save(grade);
  }

  async remove(id: string): Promise<void> {
    const result = await this.gradesRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Nota com o ID '${id}' nao encontrada.`);
    }
  }

  async getStudentGradebook(studentId: string): Promise<StudentGradebook> {
    const student = await this.userRepository.findOneBy({ id: studentId });

    if (!student) {
      throw new NotFoundException(
        `Estudante com o ID '${studentId}' nao encontrado.`,
      );
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.activities'],
    });

    const enrollmentIds = enrollments.map((enrollment) => enrollment.id);

    const grades = enrollmentIds.length
      ? await this.gradesRepository.find({
          where: { enrollment: { id: In(enrollmentIds) } },
          relations: ['enrollment', 'activity'],
        })
      : [];

    const gradeByEnrollmentAndActivity = new Map<string, Grade>();
    grades.forEach((grade) => {
      if (grade.enrollment?.id && grade.activity?.id) {
        const key = `${grade.enrollment.id}:${grade.activity.id}`;
        gradeByEnrollmentAndActivity.set(key, grade);
      }
    });

    const classes: StudentClassGrades[] = enrollments.map((enrollment) => {
      const clazz = enrollment.class;
      const activities = (clazz.activities ?? [])
        .slice()
        .sort((a, b) => {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return aTime - bTime;
        });

      const activityEntries: StudentActivityGrade[] = activities.map(
        (activity) => {
          const grade =
            gradeByEnrollmentAndActivity.get(
              `${enrollment.id}:${activity.id}`,
            ) ?? null;

          return {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            type: activity.type,
            due_date: activity.dueDate ? new Date(activity.dueDate) : null,
            max_score: activity.maxScore !== null ? Number(activity.maxScore) : null,
            grade: grade
              ? {
                  id: grade.id,
                  score: Number(grade.score),
                  gradedAt: grade.gradedAt ?? null,
                }
              : null,
          };
        },
      );

      return {
        enrollmentId: enrollment.id,
        class: {
          id: clazz.id,
          code: clazz.code,
          semester: clazz.semester,
          year: clazz.year,
        },
        activities: activityEntries,
      };
    });

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      classes,
    };
  }

  async getClassGradebook(classId: string): Promise<ClassGradebook> {
    const clazz = await this.classRepository.findOne({
      where: { id: classId },
      relations: [
        'discipline',
        'teacher',
        'activities',
        'enrollments',
        'enrollments.student',
      ],
    });

    if (!clazz) {
      throw new NotFoundException(
        `Turma com o ID '${classId}' nao encontrada.`,
      );
    }

    const enrollmentIds = (clazz.enrollments ?? []).map(
      (enrollment) => enrollment.id,
    );

    const grades: Grade[] = enrollmentIds.length
      ? await this.gradesRepository.find({
          where: { enrollment: { id: In(enrollmentIds) } },
          relations: ['enrollment', 'activity'],
        })
      : [];

    const gradeByEnrollmentAndActivity = new Map<string, Grade>();
    grades.forEach((grade) => {
      if (grade.enrollment?.id && grade.activity?.id) {
        const key = `${grade.enrollment.id}:${grade.activity.id}`;
        gradeByEnrollmentAndActivity.set(key, grade);
      }
    });

    const activities = (clazz.activities ?? [])
      .slice()
      .sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aTime - bTime;
      });

    const entries: ClassGradebookEntry[] = (clazz.enrollments ?? []).map(
      (enrollment) => ({
        enrollmentId: enrollment.id,
        student: enrollment.student
          ? {
              id: enrollment.student.id,
              name: enrollment.student.name,
              email: enrollment.student.email,
            }
          : null,
        grades: activities.map((activity) => {
          const grade =
            gradeByEnrollmentAndActivity.get(
              `${enrollment.id}:${activity.id}`,
            ) ?? null;

          return {
            activityId: activity.id,
            grade: grade
              ? {
                  id: grade.id,
                  score: Number(grade.score),
                  gradedAt: grade.gradedAt ?? null,
                }
              : null,
          };
        }),
      }),
    );

    return {
      class: {
        id: clazz.id,
        code: clazz.code,
        semester: clazz.semester,
        year: clazz.year,
        discipline: clazz.discipline
          ? {
              id: clazz.discipline.id,
              name: clazz.discipline.name,
            }
          : null,
        teacher: clazz.teacher
          ? {
              id: clazz.teacher.id,
              name: clazz.teacher.name,
              email: clazz.teacher.email,
            }
          : null,
      },
      activities: activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        type: activity.type,
        due_date: activity.dueDate ? new Date(activity.dueDate) : null,
        max_score: activity.maxScore !== null ? Number(activity.maxScore) : null,
      })),
      entries,
    };
  }

  async getStudentGradesDetailed(studentId: string): Promise<DetailedStudentGrades> {
    const student = await this.userRepository.findOneBy({ id: studentId });

    if (!student) {
      throw new NotFoundException(
        `Estudante com o ID '${studentId}' nao encontrado.`,
      );
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.discipline', 'class.activities'],
    });

    const enrollmentIds = enrollments.map((enrollment) => enrollment.id);

    const [grades, attendances] = await Promise.all([
      enrollmentIds.length
        ? this.gradesRepository.find({
            where: { enrollment: { id: In(enrollmentIds) } },
            relations: ['enrollment', 'activity'],
          })
        : ([] as Grade[]),
      enrollmentIds.length
        ? this.attendanceRepository.find({
            where: { enrollment: { id: In(enrollmentIds) } },
            relations: ['enrollment'],
          })
        : ([] as Attendance[]),
    ]);

    const gradeByEnrollmentAndActivity = new Map<string, Grade>();
    grades.forEach((grade) => {
      if (grade.enrollment?.id && grade.activity?.id) {
        const key = `${grade.enrollment.id}:${grade.activity.id}`;
        gradeByEnrollmentAndActivity.set(key, grade);
      }
    });

    const attendanceByEnrollment = new Map<string, Attendance[]>();
    attendances.forEach((attendance) => {
      const enrollmentId = attendance.enrollment.id;
      if (!attendanceByEnrollment.has(enrollmentId)) {
        attendanceByEnrollment.set(enrollmentId, []);
      }
      attendanceByEnrollment.get(enrollmentId)!.push(attendance);
    });

    const MIN_APPROVAL_SCORE = 6.0;
    const MIN_ATTENDANCE_PERCENTAGE = 75;

    const disciplines: DetailedGradeByDiscipline[] = enrollments.map((enrollment) => {
      const clazz = enrollment.class;
      const enrollmentGrades = grades.filter(
        (g) => g.enrollment.id === enrollment.id,
      );
      const enrollmentAttendances =
        attendanceByEnrollment.get(enrollment.id) || [];

      const average =
        enrollmentGrades.length > 0
          ? enrollmentGrades.reduce((sum, g) => sum + Number(g.score), 0) /
            enrollmentGrades.length
          : 0;

      const totalAttendance = enrollmentAttendances.length;
      const presentCount = enrollmentAttendances.filter((a) => a.present).length;
      const attendancePercentage =
        totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

      let status: 'approved' | 'reproved' | 'in_progress';
      const isFinished = true;

      if (!isFinished) {
        status = 'in_progress';
      } else if (
        average >= MIN_APPROVAL_SCORE &&
        attendancePercentage >= MIN_ATTENDANCE_PERCENTAGE
      ) {
        status = 'approved';
      } else {
        status = 'reproved';
      }

      const activities = (clazz.activities ?? []).sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aTime - bTime;
      });

      const gradesByPeriod: {
        period: string;
        activities: StudentActivityGrade[];
      }[] = [];

      activities.forEach((activity) => {
        const grade = gradeByEnrollmentAndActivity.get(
          `${enrollment.id}:${activity.id}`,
        );

        const activityEntry: StudentActivityGrade = {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.type,
          due_date: activity.dueDate ? new Date(activity.dueDate) : null,
          max_score: activity.maxScore !== null ? Number(activity.maxScore) : null,
          grade: grade
            ? {
                id: grade.id,
                score: Number(grade.score),
                gradedAt: grade.gradedAt ?? null,
              }
            : null,
        };

        const period = activity.dueDate
          ? this.getPeriodFromDate(new Date(activity.dueDate))
          : 'Sem período';

        let periodEntry = gradesByPeriod.find((p) => p.period === period);
        if (!periodEntry) {
          periodEntry = { period, activities: [] };
          gradesByPeriod.push(periodEntry);
        }
        periodEntry.activities.push(activityEntry);
      });

      return {
        enrollmentId: enrollment.id,
        class: {
          id: clazz.id,
          code: clazz.code,
          semester: clazz.semester,
          year: clazz.year,
          disciplineName: clazz.discipline?.name || '',
        },
        average: Math.round(average * 100) / 100,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        status,
        gradesByPeriod,
      };
    });

    return {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      disciplines,
    };
  }

  private getPeriodFromDate(date: Date): string {
    const month = date.getMonth() + 1;
    if (month >= 1 && month <= 3) return 'Bimestre 1';
    if (month >= 4 && month <= 6) return 'Bimestre 2';
    if (month >= 7 && month <= 9) return 'Bimestre 3';
    return 'Bimestre 4';
  }

  private async findEnrollment(enrollmentId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOneBy({
      id: enrollmentId,
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Matricula com o ID '${enrollmentId}' nao encontrada.`,
      );
    }

    return enrollment;
  }
}