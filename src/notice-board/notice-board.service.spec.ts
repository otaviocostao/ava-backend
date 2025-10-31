import { Test, TestingModule } from '@nestjs/testing';
import { NoticeBoardService } from './notice-board.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notice } from './entities/notice.entity';

describe('NoticeBoardService', () => {
  let service: NoticeBoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticeBoardService,
        {
          provide: getRepositoryToken(Notice),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<NoticeBoardService>(NoticeBoardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
