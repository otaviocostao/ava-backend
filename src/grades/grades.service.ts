import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Class } from '../classes/entities/class.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Grade } from './entities/grade.entity';

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
    description: string;
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
  ) {}

  async create(createGradeDto: CreateGradeDto): Promise<Grade> {
    const enrollment = await this.findEnrollment(createGradeDto.enrollmentId);

    const existingGrade = await this.gradesRepository.findOne({
      where: {
        enrollment: { id: enrollment.id },
        activityId: createGradeDto.activityId,
      },
    });

    if (existingGrade) {
      throw new ConflictException(
        'Esta atividade ja recebeu nota para a matricula informada.',
      );
    }

    const grade = this.gradesRepository.create({
      enrollment,
      activityId: createGradeDto.activityId,
      score: createGradeDto.score,
      gradedAt: createGradeDto.gradedAt
        ? new Date(createGradeDto.gradedAt)
        : undefined,
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
        where: { activityId },
        relations: ['enrollment', 'enrollment.student'],
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
              score: grade.score,
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
        due_date: activity.due_date,
        max_score: activity.max_score,
        classId: activity.class.id,
      },
      entries,
    };
  }

  findAll(query: FindGradesQuery): Promise<Grade[]> {
    const where: Record<string, unknown> = {};

    if (query.enrollmentId) {
      where.enrollment = { id: query.enrollmentId };
    }

    if (query.activityId) {
      where.activityId = query.activityId;
    }

    return this.gradesRepository.find({
      where,
      relations: ['enrollment'],
    });
  }

  async findOne(id: string): Promise<Grade> {
    const grade = await this.gradesRepository.findOne({
      where: { id },
      relations: ['enrollment'],
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
      updateGradeDto.activityId !== grade.activityId
    ) {
      const duplicate = await this.gradesRepository.findOne({
        where: {
          enrollment: { id: grade.enrollment.id },
          activityId: updateGradeDto.activityId,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Esta atividade ja recebeu nota para a matricula informada.',
        );
      }

      grade.activityId = updateGradeDto.activityId;
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
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

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
          relations: ['enrollment'],
        })
      : [];

    const gradeByEnrollmentAndActivity = new Map<string, Grade>();
    grades.forEach((grade) => {
      gradeByEnrollmentAndActivity.set(
        `${grade.enrollment.id}:${grade.activityId}`,
        grade,
      );
    });

    const classes: StudentClassGrades[] = enrollments.map((enrollment) => {
      const clazz = enrollment.class;
      const activities = (clazz.activities ?? [])
        .slice()
        .sort((a, b) => {
          const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
          if (aTime === bTime) {
            return a.title.localeCompare(b.title);
          }
          return aTime - bTime;
        });

      const activityEntries: StudentActivityGrade[] = activities.map((activity) => {
        const grade =
          gradeByEnrollmentAndActivity.get(
            `${enrollment.id}:${activity.id}`,
          ) ?? null;

        return {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.type,
          due_date: activity.due_date ?? null,
          max_score: activity.max_score ?? null,
          grade: grade
            ? {
                id: grade.id,
                score: grade.score,
                gradedAt: grade.gradedAt ?? null,
              }
            : null,
        };
      });

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

    const grades = enrollmentIds.length
      ? await this.gradesRepository.find({
          where: { enrollment: { id: In(enrollmentIds) } },
          relations: ['enrollment'],
        })
      : [];

    const gradeByEnrollmentAndActivity = new Map<string, Grade>();
    grades.forEach((grade) => {
      gradeByEnrollmentAndActivity.set(
        `${grade.enrollment.id}:${grade.activityId}`,
        grade,
      );
    });

    const activities = (clazz.activities ?? [])
      .slice()
      .sort((a, b) => {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime === bTime) {
          return a.title.localeCompare(b.title);
        }
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
                  score: grade.score,
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
        due_date: activity.due_date ?? null,
        max_score: activity.max_score ?? null,
      })),
      entries,
    };
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
