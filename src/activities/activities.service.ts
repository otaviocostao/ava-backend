import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivitySubmission } from './entities/activity-submission.entity';
import { Class } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { ActivitySubmissionStatus } from '../common/enums/activity-submission-status.enum';

@Injectable()
export class ActivitiesService {
  private readonly activityRelations = ['class', 'class.discipline', 'class.teacher'];

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivitySubmission)
    private readonly activitySubmissionRepository: Repository<ActivitySubmission>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const { classId, ...rest } = createActivityDto;

    const classEntity = await this.findClassOrThrowException(classId);

    const activity = this.activityRepository.create({
      ...rest,
      class: classEntity,
    });

    return this.activityRepository.save(activity);
  }

  async findAll(): Promise<Activity[]> {
    return this.activityRepository.find({
      relations: this.activityRelations,
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: this.activityRelations,
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto): Promise<Activity> {
    const { classId, ...rest } = updateActivityDto;

    const preloadData: Partial<Activity> = {
      id,
      ...rest,
    };

    if (classId !== undefined) {
      const classEntity = await this.findClassOrThrowException(classId);
      preloadData.class = classEntity;
    }

    const activity = await this.activityRepository.preload(preloadData);
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
    return this.activityRepository.save(activity);
  }

  async remove(id: string): Promise<void> {
    const activity = await this.findOne(id);
    await this.activityRepository.remove(activity);
  }

  async findByClassId(classId: string): Promise<Activity[]> {
    await this.findClassOrThrowException(classId);

    return this.activityRepository.find({
      where: { class: { id: classId } },
      relations: this.activityRelations,
      order: { dueDate: 'ASC' },
    });
  }

  async findByStudentId(studentId: string): Promise<Activity[]> {
    const student = await this.userRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class'],
    });

    const classIds = enrollments.map((e) => e.class.id);
    if (classIds.length === 0) {
      return [];
    }

    return this.activityRepository.find({
      where: { class: { id: In(classIds) } },
      relations: this.activityRelations,
      order: { dueDate: 'ASC' },
    });
  }

  async findAllWithFilters(query: {
    studentId?: string;
    classId?: string;
    status?: ActivitySubmissionStatus;
  }): Promise<Activity[]> {
    if (query.studentId) {
      return this.findByStudentId(query.studentId);
    }

    if (query.classId) {
      return this.findByClassId(query.classId);
    }

    return this.findAll();
  }

  async completeActivity(activityId: string, studentId: string): Promise<ActivitySubmission> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({ where: { id: activityId } }),
      this.userRepository.findOne({ where: { id: studentId } }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    const existingSubmission = await this.activitySubmissionRepository.findOne({
      where: { activity: { id: activityId }, student: { id: studentId } },
    });

    if (existingSubmission) {
      existingSubmission.status = ActivitySubmissionStatus.COMPLETED;
      existingSubmission.submittedAt = new Date();
      return this.activitySubmissionRepository.save(existingSubmission);
    }

    const submission = this.activitySubmissionRepository.create({
      activity,
      student,
      status: ActivitySubmissionStatus.COMPLETED,
      submittedAt: new Date(),
    });

    return this.activitySubmissionRepository.save(submission);
  }

  async submitActivity(
    activityId: string,
    studentId: string,
    fileUrl?: string,
  ): Promise<ActivitySubmission> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({ where: { id: activityId } }),
      this.userRepository.findOne({ where: { id: studentId } }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    const existingSubmission = await this.activitySubmissionRepository.findOne({
      where: { activity: { id: activityId }, student: { id: studentId } },
    });

    if (existingSubmission) {
      existingSubmission.status = ActivitySubmissionStatus.SUBMITTED;
      existingSubmission.fileUrl = fileUrl || existingSubmission.fileUrl;
      existingSubmission.submittedAt = new Date();
      return this.activitySubmissionRepository.save(existingSubmission);
    }

    const submission = this.activitySubmissionRepository.create({
      activity,
      student,
      status: ActivitySubmissionStatus.SUBMITTED,
      fileUrl: fileUrl || null,
      submittedAt: new Date(),
    });

    return this.activitySubmissionRepository.save(submission);
  }

  async findSubmissionsByActivityId(activityId: string): Promise<ActivitySubmission[]> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    return this.activitySubmissionRepository.find({
      where: { activity: { id: activityId } },
      relations: ['student', 'activity'],
      order: { submittedAt: 'DESC' },
    });
  }

  async findSubmissionByActivityAndStudent(
    activityId: string,
    studentId: string,
  ): Promise<ActivitySubmission> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({ where: { id: activityId } }),
      this.userRepository.findOne({ where: { id: studentId } }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    const submission = await this.activitySubmissionRepository.findOne({
      where: { activity: { id: activityId }, student: { id: studentId } },
      relations: ['student', 'activity'],
    });

    if (!submission) {
      throw new NotFoundException(
        `Submissao nao encontrada para a atividade "${activityId}" e estudante "${studentId}".`,
      );
    }

    return submission;
  }

  async findSubmissionsByStudentId(studentId: string): Promise<ActivitySubmission[]> {
    const student = await this.userRepository.findOne({ where: { id: studentId } });

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    return this.activitySubmissionRepository.find({
      where: { student: { id: studentId } },
      relations: ['activity', 'activity.class'],
      order: { submittedAt: 'DESC' },
    });
  }

  async findSubmissionById(submissionId: string): Promise<ActivitySubmission> {
    const submission = await this.activitySubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['student', 'activity', 'activity.class'],
    });

    if (!submission) {
      throw new NotFoundException(`Submissao com ID "${submissionId}" nao encontrada.`);
    }

    return submission;
  }

  private async findClassOrThrowException(classId: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Turma com ID "${classId}" nao encontrada.`);
    }

    return classEntity;
  }
}
