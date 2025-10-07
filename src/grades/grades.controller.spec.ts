import { Test, TestingModule } from '@nestjs/testing';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { Grade } from './entities/grade.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

type GradesServiceMock = jest.Mocked<
  Pick<GradesService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>
>;

const createGradesServiceMock = (): GradesServiceMock => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('GradesController', () => {
  let controller: GradesController;
  let gradesServiceMock: GradesServiceMock;

  beforeEach(async () => {
    gradesServiceMock = createGradesServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradesController],
      providers: [
        {
          provide: GradesService,
          useValue: gradesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<GradesController>(GradesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a grade via the service', async () => {
    const dto: CreateGradeDto = {
      enrollmentId: 'enrollment-id',
      activityId: 'activity-id',
      score: 95.5,
      gradedAt: '2025-01-01T00:00:00.000Z',
    };
    const grade = { id: 'grade-id', ...dto } as unknown as Grade;

    gradesServiceMock.create.mockResolvedValue(grade);

    const result = await controller.create(dto);

    expect(gradesServiceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(grade);
  });

  it('should return all grades from the service', async () => {
    const grades = [
      { id: 'grade-1', activityId: 'activity-1' },
      { id: 'grade-2', activityId: 'activity-2' },
    ] as unknown as Grade[];
    const query = { enrollmentId: 'enrollment-id' };

    gradesServiceMock.findAll.mockResolvedValue(grades);

    const result = await controller.findAll(query);

    expect(gradesServiceMock.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(grades);
  });

  it('should return a single grade from the service', async () => {
    const grade = { id: 'grade-id', activityId: 'activity-id' } as Grade;

    gradesServiceMock.findOne.mockResolvedValue(grade);

    const result = await controller.findOne('grade-id');

    expect(gradesServiceMock.findOne).toHaveBeenCalledWith('grade-id');
    expect(result).toEqual(grade);
  });

  it('should update a grade via the service', async () => {
    const dto: UpdateGradeDto = { score: 88.5 };
    const updated = { id: 'grade-id', score: 88.5 } as unknown as Grade;

    gradesServiceMock.update.mockResolvedValue(updated);

    const result = await controller.update('grade-id', dto);

    expect(gradesServiceMock.update).toHaveBeenCalledWith('grade-id', dto);
    expect(result).toEqual(updated);
  });

  it('should remove a grade via the service', async () => {
    gradesServiceMock.remove.mockResolvedValue(undefined);

    await expect(controller.remove('grade-id')).resolves.toBeUndefined();
    expect(gradesServiceMock.remove).toHaveBeenCalledWith('grade-id');
  });

  it('should propagate errors thrown by the service when creating a grade', async () => {
    const dto: CreateGradeDto = {
      enrollmentId: 'enrollment-id',
      activityId: 'activity-id',
      score: 75,
    };
    const error = new Error('create failed');

    gradesServiceMock.create.mockRejectedValue(error);

    await expect(controller.create(dto)).rejects.toThrow(error);
  });

  it('should propagate errors thrown by the service when listing grades', async () => {
    const query = { activityId: 'activity-id' };
    const error = new Error('list failed');

    gradesServiceMock.findAll.mockRejectedValue(error);

    await expect(controller.findAll(query)).rejects.toThrow(error);
  });

  it('should propagate errors thrown by the service when fetching a grade', async () => {
    const error = new Error('not found');

    gradesServiceMock.findOne.mockRejectedValue(error);

    await expect(controller.findOne('grade-id')).rejects.toThrow(error);
  });

  it('should propagate errors thrown by the service when updating a grade', async () => {
    const dto: UpdateGradeDto = { score: 90 };
    const error = new Error('update failed');

    gradesServiceMock.update.mockRejectedValue(error);

    await expect(controller.update('grade-id', dto)).rejects.toThrow(error);
  });

  it('should propagate errors thrown by the service when removing a grade', async () => {
    const error = new Error('remove failed');

    gradesServiceMock.remove.mockRejectedValue(error);

    await expect(controller.remove('grade-id')).rejects.toThrow(error);
  });
});
