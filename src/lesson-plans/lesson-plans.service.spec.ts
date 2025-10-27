import { Test, TestingModule } from '@nestjs/testing';
import { LessonPlansService } from './lesson-plans.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessonPlan } from './entities/lesson-plan.entity';
import { Class } from '../classes/entities/class.entity';

describe('LessonPlansService', () => {
  let service: LessonPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonPlansService,
        {
          provide: getRepositoryToken(LessonPlan),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Class),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<LessonPlansService>(LessonPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
