import { Test, TestingModule } from '@nestjs/testing';
import { LessonPlansService } from './lesson-plans.service';

describe('LessonPlansService', () => {
  let service: LessonPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LessonPlansService],
    }).compile();

    service = module.get<LessonPlansService>(LessonPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
