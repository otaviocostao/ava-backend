import { Test, TestingModule } from '@nestjs/testing';
import { ActivityGradesController } from './activity-grades.controller';
import { CreateActivityGradeDto } from './dto/create-activity-grade.dto';
import { GradesService } from './grades.service';

describe('ActivityGradesController', () => {
  let controller: ActivityGradesController;
  let gradesService: {
    getActivityGradebook: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    gradesService = {
      getActivityGradebook: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityGradesController],
      providers: [
        {
          provide: GradesService,
          useValue: gradesService,
        },
      ],
    }).compile();

    controller = module.get<ActivityGradesController>(ActivityGradesController);
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  it('retorna o boletim da atividade via o servico', async () => {
    const gradebook = { activity: { id: 'activity-id' }, entries: [] };
    gradesService.getActivityGradebook.mockResolvedValue(gradebook);

    const result = await controller.getGradebook('activity-id');

    expect(gradesService.getActivityGradebook).toHaveBeenCalledWith(
      'activity-id',
    );
    expect(result).toEqual(gradebook);
  });

  it('cria uma nota para a atividade via o servico', async () => {
    const dto: CreateActivityGradeDto = {
      enrollmentId: 'enrollment-id',
      score: 95.75,
      gradedAt: '2025-01-01T00:00:00.000Z',
    };
    const created = { id: 'grade-id' };

    gradesService.create.mockResolvedValue(created);

    const result = await controller.createGradeForActivity('activity-id', dto);

    expect(gradesService.create).toHaveBeenCalledWith({
      ...dto,
      activityId: 'activity-id',
    });
    expect(result).toEqual(created);
  });
});
