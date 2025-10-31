import { Test, TestingModule } from '@nestjs/testing';
import { NoticeBoardController } from './notice-board.controller';
import { NoticeBoardService } from './notice-board.service';

describe('NoticeBoardController', () => {
  let controller: NoticeBoardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticeBoardController],
      providers: [
        {
          provide: NoticeBoardService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findForAudience: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NoticeBoardController>(NoticeBoardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
