import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
});

describe('GradesService', () => {
  let service: GradesService;
  let gradesRepositoryMock: ReturnType<typeof createGradesRepositoryMock>;
  let enrollmentRepositoryMock: ReturnType<typeof createEnrollmentRepositoryMock>;

  beforeEach(async () => {
    gradesRepositoryMock = createGradesRepositoryMock();
    enrollmentRepositoryMock = createEnrollmentRepositoryMock();

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
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a grade when enrollment exists and no duplicate', async () => {
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

    it('throws NotFoundException when enrollment does not exist', async () => {
      const dto = {
        enrollmentId: 'missing-enrollment',
        activityId: 'activity-id',
        score: 80,
      };

      enrollmentRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(gradesRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when grade already exists for activity', async () => {
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
    it('returns grades with applied filters', async () => {
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
    it('returns a grade when found', async () => {
      const grade = { id: 'grade-id' } as Grade;
      gradesRepositoryMock.findOne.mockResolvedValue(grade);

      const result = await service.findOne('grade-id');

      expect(gradesRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'grade-id' },
        relations: ['enrollment'],
      });
      expect(result).toEqual(grade);
    });

    it('throws NotFoundException when grade not found', async () => {
      gradesRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-grade')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates the grade score successfully', async () => {
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

    it('updates enrollment when enrollmentId is provided', async () => {
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

    it('throws NotFoundException when enrollmentId is invalid during update', async () => {
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

    it('throws ConflictException when updating to duplicate activity', async () => {
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
    it('removes a grade successfully', async () => {
      gradesRepositoryMock.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('grade-id')).resolves.toBeUndefined();
      expect(gradesRepositoryMock.delete).toHaveBeenCalledWith('grade-id');
    });

    it('throws NotFoundException when grade does not exist', async () => {
      gradesRepositoryMock.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('missing-grade')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
