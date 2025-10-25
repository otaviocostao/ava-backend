import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from './entities/grade.entity';
import { GradesService } from './grades.service';

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
});

describe('GradesService', () => {
  let service: GradesService;
  let gradesRepositoryMock: ReturnType<typeof createGradesRepositoryMock>;
  let enrollmentRepositoryMock: ReturnType<typeof createEnrollmentRepositoryMock>;
  let activityRepositoryMock: ReturnType<typeof createActivityRepositoryMock>;

  beforeEach(async () => {
    gradesRepositoryMock = createGradesRepositoryMock();
    enrollmentRepositoryMock = createEnrollmentRepositoryMock();
    activityRepositoryMock = createActivityRepositoryMock();

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
      const created = { id: 'grade-id', ...dto, enrollment } as unknown as Grade;

      enrollmentRepositoryMock.findOneBy.mockResolvedValue(enrollment);
      gradesRepositoryMock.findOne.mockResolvedValue(null);
      gradesRepositoryMock.create.mockReturnValue(created);
      gradesRepositoryMock.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(gradesRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollment,
          activityId: dto.activityId,
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

      enrollmentRepositoryMock.findOneBy.mockResolvedValue(enrollment);
      gradesRepositoryMock.findOne.mockResolvedValue({ id: 'existing-grade' } as Grade);

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
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
          activityId: 'activity-id',
        },
        relations: ['enrollment'],
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
        relations: ['enrollment'],
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
        due_date: new Date('2025-02-01'),
        max_score: 100,
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
        activityId: 'activity-id',
        gradedAt: new Date('2025-02-02'),
      } as Grade;
      gradesRepositoryMock.find.mockResolvedValue([grade]);

      const result = await service.getActivityGradebook('activity-id');

      expect(activityRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'activity-id' },
        relations: ['class'],
      });
      expect(enrollmentRepositoryMock.find).toHaveBeenCalledWith({
        where: { class: { id: 'class-id' } },
        relations: ['student'],
      });
      expect(gradesRepositoryMock.find).toHaveBeenCalledWith({
        where: { activityId: 'activity-id' },
        relations: ['enrollment', 'enrollment.student'],
      });
      expect(result).toEqual({
        activity: {
          id: activity.id,
          title: activity.title,
          description: activity.description,
          type: activity.type,
          due_date: activity.due_date,
          max_score: activity.max_score,
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
      activityRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getActivityGradebook('missing-activity')).rejects.toBeInstanceOf(
        NotFoundException,
      );
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
        activityId: 'activity-id',
        enrollment: { id: 'enrollment-id' },
        score: 75,
        gradedAt: new Date(),
      } as unknown as Grade;
      const updated = { ...grade, score: 90 } as Grade;

      jest.spyOn(service, 'findOne').mockResolvedValue(grade);
      gradesRepositoryMock.save.mockResolvedValue(updated);

      const result = await service.update('grade-id', { score: 90 });

      expect(gradesRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ score: 90 }),
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
        activityId: 'activity-id',
        enrollment: { id: 'enrollment-id' },
        score: 75,
      } as unknown as Grade;

      jest.spyOn(service, 'findOne').mockResolvedValue(grade);
      gradesRepositoryMock.findOne.mockResolvedValue({
        id: 'other-grade',
        activityId: 'new-activity',
      } as Grade);

      await expect(
        service.update('grade-id', { activityId: 'new-activity' }),
      ).rejects.toBeInstanceOf(ConflictException);
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
