import { Test, TestingModule } from '@nestjs/testing';
import { DisciplinesService } from './disciplines.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Discipline } from './entities/discipline.entity';
import { Course } from '../courses/entities/course.entity';

describe('DisciplinesService', () => {
  let service: DisciplinesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisciplinesService,
        {
          provide: getRepositoryToken(Discipline),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Course),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DisciplinesService>(DisciplinesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
