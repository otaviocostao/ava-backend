import { Test, TestingModule } from '@nestjs/testing';
import { ForumsService } from './forums.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Forum } from './entities/forum.entity';
import { Class } from '../classes/entities/class.entity';

describe('ForumsService', () => {
  let service: ForumsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumsService,
        {
          provide: getRepositoryToken(Forum),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Class),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ForumsService>(ForumsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
