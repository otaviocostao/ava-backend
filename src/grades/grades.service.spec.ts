import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Class } from '../classes/entities/class.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { Grade } from './entities/grade.entity';
import { GradesService } from './grades.service';
import { Attendance } from 'src/attendances/entities/attendance.entity';

const createGradesRepositoryMock = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
});

const createEnrollmentRepositoryMock = () => ({
  findOneBy: jest.fn(),
  find: jest.fn(),
});

const createActivityRepositoryMock = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
});

const createClassRepositoryMock = () => ({
  findOne: jest.fn(),
});

const createUserRepositoryMock = () => ({
  findOne: jest.fn(),
});

const createAttendanceRepositoryMock = () => ({
  find: jest.fn(),
});

describe('GradesService', () => {
  let service: GradesService;
  let gradesRepositoryMock: ReturnType<typeof createGradesRepositoryMock>;
  let enrollmentRepositoryMock: ReturnType<typeof createEnrollmentRepositoryMock>;
  let activityRepositoryMock: ReturnType<typeof createActivityRepositoryMock>;
  let classRepositoryMock: ReturnType<typeof createClassRepositoryMock>;
  let userRepositoryMock: ReturnType<typeof createUserRepositoryMock>;
  let attendanceRepositoryMock: ReturnType<typeof createAttendanceRepositoryMock>;

  beforeEach(async () => {
    gradesRepositoryMock = createGradesRepositoryMock();
    enrollmentRepositoryMock = createEnrollmentRepositoryMock();
    activityRepositoryMock = createActivityRepositoryMock();
    classRepositoryMock = createClassRepositoryMock();
    userRepositoryMock = createUserRepositoryMock();
    attendanceRepositoryMock = createAttendanceRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        {
          provide: getRepositoryToken(Grade),
          useValue: gradesRepositoryMock,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepositoryMock,
        },
        {
          provide: getRepositoryToken(Activity),
          useValue: activityRepositoryMock,
        },
        {
          provide: getRepositoryToken(Class),
          useValue: classRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: attendanceRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('cria uma nota quando a matricula existe e nao ha duplicidade', async () => {
      const dto = {
        enrollmentId: 'enrollment-id',
        activityId: 'activity-id',
        score: 95.5,
        gradedAt: '2025-01-01T00:00:00.000Z',
      };
      const enrollment = { id: dto.enrollmentId } as Enrollment;
      const activity = { id: dto.activityId } as Activity;
      const created = { id: 'grade-id', ...dto, enrollment } as unknown as Grade;

      enrollmentRepositoryMock.findOneBy.mockResolvedValue(enrollment);
      activityRepositoryMock.findOneBy.mockResolvedValue(activity);
      gradesRepositoryMock.findOne.mockResolvedValue(null);
      gradesRepositoryMock.create.mockReturnValue(created);
      gradesRepositoryMock.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(gradesRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollment,
          activity: { id: dto.activityId },
          score: dto.score,
          gradedAt: expect.any(Date),
        }),
      );
      expect(gradesRepositoryMock.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('lanca NotFoundException quando a matricula nao existe', async () => {
      const dto = {
        enrollmentId: 'missing-enrollment',
        activityId: 'activity-id',
        score: 80,
      };

      enrollmentRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(gradesRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('lanca ConflictException quando a atividade ja possui nota para a matricula', async () => {
      const dto = {
        enrollmentId: 'enrollment-id',
        activityId: 'activity-id',
        score: 70,
      };
      const enrollment = { id: dto.enrollmentId } as Enrollment;
      const activity = { id: dto.activityId } as Activity;

      enrollmentRepositoryMock.findOneBy.mockResolvedValue(enrollment);
      activityRepositoryMock.findOneBy.mockResolvedValue(activity);
      gradesRepositoryMock.findOne.mockResolvedValue({ id: 'existing-grade' } as Grade);

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(gradesRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          enrollment: { id: enrollment.id },
          activity: { id: activity.id },
        },
      });
    });
  });

  describe('findAll', () => {
    it('retorna as notas com os filtros aplicados', async () => {
      const grades = [{ id: 'grade-id' } as Grade];
      gradesRepositoryMock.find.mockResolvedValue(grades);

      const result = await service.findAll({
        enrollmentId: 'enrollment-id',
        activityId: 'activity-id',
      });

      expect(gradesRepositoryMock.find).toHaveBeenCalledWith({
        where: {
          enrollment: { id: 'enrollment-id' },
          activity: { id: 'activity-id' },
        },
        relations: ['enrollment', 'activity'],
      });
      expect(result).toEqual(grades);
    });
  });

  describe('findOne', () => {
    it('retorna uma nota quando encontrada', async () => {
      const grade = { id: 'grade-id' } as Grade;
      gradesRepositoryMock.findOne.mockResolvedValue(grade);

      const result = await service.findOne('grade-id');

      expect(gradesRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'grade-id' },
        relations: ['enrollment', 'activity'],
      });
      expect(result).toEqual(grade);
    });

    it('lanca NotFoundException quando a nota nao e encontrada', async () => {
      gradesRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-grade')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getActivityGradebook', () => {
    it('retorna o boletim da atividade', async () => {
      const activity = {
        id: 'activity-id',
        title: 'Prova 1',
        description: 'Primeira prova',
        type: 'exam',
        dueDate: '2025-02-01',
        maxScore: 100,
        class: { id: 'class-id' },
      } as unknown as Activity;
      activityRepositoryMock.findOne.mockResolvedValue(activity);

      const enrollments = [
        {
          id: 'enrollment-1',
          student: { id: 'student-1', name: 'Alice', email: 'alice@example.com' },
        },
        {
          id: 'enrollment-2',
          student: { id: 'student-2', name: 'Bob', email: 'bob@example.com' },
        },
      ] as unknown as Enrollment[];
      enrollmentRepositoryMock.find.mockResolvedValue(enrollments);

      const grade = {
        id: 'grade-1',
        enrollment: enrollments[0],
        score: 98.5,
        activity: { id: 'activity-id' }, 
        gradedAt: new Date('2025-02-02'),
      } as Grade;
      gradesRepositoryMock.find.mockResolvedValue([grade]);

      const result = await service.getActivityGradebook('activity-id');

      expect(gradesRepositoryMock.find).toHaveBeenCalledWith({
        where: { activity: { id: 'activity-id' } }, 
        relations: ['enrollment'], 
      });
      expect(result).toEqual({
        activity: {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.type,
          due_date: new Date(activity.dueDate),
          max_score: activity.maxScore,
          classId: 'class-id',
        },
        entries: [
          {
            enrollmentId: 'enrollment-1',
            student: enrollments[0].student,
            grade: {
              id: grade.id,
              score: grade.score,
              gradedAt: grade.gradedAt,
            },
          },
          {
            enrollmentId: 'enrollment-2',
            student: enrollments[1].student,
            grade: null,
          },
        ],
      });
    });

    it('lanca NotFoundException quando a atividade nao existe', async () => {
      const dto = {
        enrollmentId: 'enrollment-id',
        activityId: 'missing-activity',
        score: 80,
      };
      const enrollment = { id: dto.enrollmentId } as Enrollment;

      enrollmentRepositoryMock.findOneBy.mockResolvedValue(enrollment);
      activityRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanca NotFoundException quando a atividade nao esta associada a uma turma', async () => {
      const activity = {
        id: 'activity-id',
        class: null,
      } as unknown as Activity;
      activityRepositoryMock.findOne.mockResolvedValue(activity);

      await expect(service.getActivityGradebook('activity-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza a pontuacao da nota com sucesso', async () => {
      const grade = {
        id: 'grade-id',
        activity: { id: 'activity-id' },
        enrollment: { id: 'enrollment-id' },
        score: 75,
      } as unknown as Grade;
      const updated = { ...grade, score: 90 } as Grade;

      jest.spyOn(service, 'findOne').mockResolvedValue(grade);
      gradesRepositoryMock.save.mockResolvedValue(updated);

      const result = await service.update('grade-id', { score: 90 });

      expect(gradesRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'grade-id', score: 90 }),
      );
      expect(result).toEqual(updated);
    });

    it('atualiza a matricula quando enrollmentId e informado', async () => {
      const grade = {
        id: 'grade-id',
        activityId: 'activity-id',
        enrollment: { id: 'old-enrollment' },
        score: 75,
      } as unknown as Grade;
      const newEnrollment = { id: 'new-enrollment' } as Enrollment;

      jest.spyOn(service, 'findOne').mockResolvedValue(grade);
      enrollmentRepositoryMock.findOneBy.mockResolvedValue(newEnrollment);
      gradesRepositoryMock.save.mockResolvedValue({ ...grade, enrollment: newEnrollment });

      await service.update('grade-id', { enrollmentId: 'new-enrollment' });

      expect(enrollmentRepositoryMock.findOneBy).toHaveBeenCalledWith({
        id: 'new-enrollment',
      });
      expect(gradesRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ enrollment: newEnrollment }),
      );
    });

    it('lanca NotFoundException quando enrollmentId e invalido durante a atualizacao', async () => {
      const grade = {
        id: 'grade-id',
        activityId: 'activity-id',
        enrollment: { id: 'old-enrollment' },
        score: 75,
      } as unknown as Grade;

      jest.spyOn(service, 'findOne').mockResolvedValue(grade);
      enrollmentRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('grade-id', { enrollmentId: 'missing-enrollment' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanca ConflictException ao tentar atualizar para uma atividade duplicada', async () => {
      const grade = {
        id: 'grade-id',
        activity: { id: 'old-activity-id' },
        enrollment: { id: 'enrollment-id' },
      } as unknown as Grade;

      const newActivity = { id: 'new-activity-id' } as Activity;

      jest.spyOn(service, 'findOne').mockResolvedValue(grade);
      activityRepositoryMock.findOneBy.mockResolvedValue(newActivity);
      gradesRepositoryMock.findOne.mockResolvedValue({ id: 'other-grade' } as Grade); 

      await expect(
        service.update('grade-id', { activityId: 'new-activity-id' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(gradesRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          enrollment: { id: 'enrollment-id' },
          activity: { id: 'new-activity-id' },
        },
      });
    });
    
    describe('remove', () => {
      it('remove uma nota com sucesso', async () => {
        gradesRepositoryMock.delete.mockResolvedValue({ affected: 1 });
  
        await expect(service.remove('grade-id')).resolves.toBeUndefined();
        expect(gradesRepositoryMock.delete).toHaveBeenCalledWith('grade-id');
      });
  
      it('lanca NotFoundException quando a nota nao existe', async () => {
        gradesRepositoryMock.delete.mockResolvedValue({ affected: 0 });
  
        await expect(service.remove('missing-grade')).rejects.toBeInstanceOf(
          NotFoundException,
        );
      });
    });
  });
});