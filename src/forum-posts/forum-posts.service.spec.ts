import { Test, TestingModule } from '@nestjs/testing';
import { ForumPostsService } from './forum-posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForumPost } from './entities/forum-post.entity';
import { User } from '../users/entities/user.entity';
import { Forum } from '../forums/entities/forum.entity';

describe('ForumPostsService', () => {
  let service: ForumPostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumPostsService,
        {
          provide: getRepositoryToken(ForumPost),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Forum),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ForumPostsService>(ForumPostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
