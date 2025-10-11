import { Test, TestingModule } from '@nestjs/testing';
import { LessonPlansController } from './lesson-plans.controller';
import { LessonPlansService } from './lesson-plans.service';

describe('LessonPlansController', () => {
  let controller: LessonPlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonPlansController],
      providers: [LessonPlansService],
    }).compile();

    controller = module.get<LessonPlansController>(LessonPlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
