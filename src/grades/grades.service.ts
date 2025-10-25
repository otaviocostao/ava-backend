import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
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

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradesRepository: Repository<Grade>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
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
