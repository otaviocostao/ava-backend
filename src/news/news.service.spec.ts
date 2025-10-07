import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NewsTargetType } from '../common/enums/news-target-type.enum';
import { User } from '../users/entities/user.entity';
import { News } from './entities/news.entity';
import { NewsService } from './news.service';

const createNewsRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

const createUserRepositoryMock = () => ({
  findOneBy: jest.fn(),
});

describe('NewsService', () => {
  let service: NewsService;
  let newsRepositoryMock: ReturnType<typeof createNewsRepositoryMock>;
  let userRepositoryMock: ReturnType<typeof createUserRepositoryMock>;

  beforeEach(async () => {
    newsRepositoryMock = createNewsRepositoryMock();
    userRepositoryMock = createUserRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: getRepositoryToken(News),
          useValue: newsRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates news when publisher exists and target combination is valid', async () => {
      const dto = {
        title: 'Title',
        content: 'Body',
        publishedById: 'user-id',
        targetType: NewsTargetType.COURSE,
        targetId: 'course-id',
        publishedAt: '2025-01-01T00:00:00.000Z',
      };
      const publisher = { id: 'user-id' } as User;
      const news = { id: 'news-id', ...dto, publishedBy: publisher } as unknown as News;

      userRepositoryMock.findOneBy.mockResolvedValue(publisher);
      newsRepositoryMock.findOne.mockResolvedValue(undefined);
      newsRepositoryMock.create.mockReturnValue(news);
      newsRepositoryMock.save.mockResolvedValue(news);

      const result = await service.create(dto);

      expect(newsRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          content: dto.content,
          publishedBy: publisher,
          targetType: dto.targetType,
          targetId: dto.targetId,
        }),
      );
      expect(result).toEqual(news);
    });

    it('allows creation without target data', async () => {
      const dto = {
        title: 'Title',
        content: 'Body',
        publishedById: 'user-id',
      };
      const publisher = { id: 'user-id' } as User;
      const news = { id: 'news-id', ...dto, publishedBy: publisher } as unknown as News;

      userRepositoryMock.findOneBy.mockResolvedValue(publisher);
      newsRepositoryMock.create.mockReturnValue(news);
      newsRepositoryMock.save.mockResolvedValue(news);

      const result = await service.create(dto);

      expect(newsRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: null,
          targetId: null,
        }),
      );
      expect(result).toEqual(news);
    });

    it('throws NotFoundException when publisher does not exist', async () => {
      const dto = {
        title: 'Title',
        content: 'Body',
        publishedById: 'missing-user',
      };

      userRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(newsRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when only targetType is provided', async () => {
      const dto = {
        title: 'Title',
        content: 'Body',
        publishedById: 'user-id',
        targetType: NewsTargetType.CLASS,
      };

      await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepositoryMock.findOneBy).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when only targetId is provided', async () => {
      const dto = {
        title: 'Title',
        content: 'Body',
        publishedById: 'user-id',
        targetId: 'only-id',
      };

      await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepositoryMock.findOneBy).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('applies filters correctly', async () => {
      const news = [{ id: 'news-id' } as News];
      newsRepositoryMock.find.mockResolvedValue(news);

      const result = await service.findAll({
        targetType: NewsTargetType.COURSE,
        targetId: 'course-id',
        publishedById: 'user-id',
      });

      expect(newsRepositoryMock.find).toHaveBeenCalledWith({
        where: {
          targetType: NewsTargetType.COURSE,
          targetId: 'course-id',
          publishedBy: { id: 'user-id' },
        },
        relations: ['publishedBy'],
        order: { publishedAt: 'DESC' },
      });
      expect(result).toEqual(news);
    });
  });

  describe('findOne', () => {
    it('returns news when found', async () => {
      const news = { id: 'news-id' } as News;
      newsRepositoryMock.findOne.mockResolvedValue(news);

      const result = await service.findOne('news-id');

      expect(newsRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 'news-id' },
        relations: ['publishedBy'],
      });
      expect(result).toEqual(news);
    });

    it('throws NotFoundException when not found', async () => {
      newsRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates basic fields', async () => {
      const news = {
        id: 'news-id',
        title: 'Old',
        content: 'Old content',
        publishedBy: { id: 'user-id' },
        targetType: null,
        targetId: null,
        publishedAt: new Date('2025-01-01T00:00:00.000Z'),
      } as unknown as News;
      const updated = { ...news, title: 'New', content: 'New content' } as News;

      jest.spyOn(service, 'findOne').mockResolvedValue(news);
      newsRepositoryMock.save.mockResolvedValue(updated);

      const result = await service.update('news-id', {
        title: 'New',
        content: 'New content',
      });

      expect(newsRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New',
          content: 'New content',
        }),
      );
      expect(result).toEqual(updated);
    });

    it('updates publisher when publishedById provided', async () => {
      const news = {
        id: 'news-id',
        publishedBy: { id: 'old-user' },
      } as unknown as News;
      const newPublisher = { id: 'new-user' } as User;

      jest.spyOn(service, 'findOne').mockResolvedValue(news);
      userRepositoryMock.findOneBy.mockResolvedValue(newPublisher);
      newsRepositoryMock.save.mockResolvedValue({ ...news, publishedBy: newPublisher });

      await service.update('news-id', { publishedById: 'new-user' });

      expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 'new-user' });
      expect(newsRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ publishedBy: newPublisher }),
      );
    });

    it('throws NotFoundException when new publisher not found', async () => {
      const news = { id: 'news-id', publishedBy: { id: 'old-user' } } as News;

      jest.spyOn(service, 'findOne').mockResolvedValue(news);
      userRepositoryMock.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('news-id', { publishedById: 'missing-user' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates target info when both fields provided', async () => {
      const news = {
        id: 'news-id',
        targetType: null,
        targetId: null,
      } as unknown as News;

      jest.spyOn(service, 'findOne').mockResolvedValue(news);
      newsRepositoryMock.save.mockResolvedValue({
        ...news,
        targetType: NewsTargetType.CLASS,
        targetId: 'class-id',
      });

      await service.update('news-id', {
        targetType: NewsTargetType.CLASS,
        targetId: 'class-id',
      });

      expect(newsRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: NewsTargetType.CLASS,
          targetId: 'class-id',
        }),
      );
    });

    it('allows removing target info by setting both fields to undefined', async () => {
      const news = {
        id: 'news-id',
        targetType: NewsTargetType.COURSE,
        targetId: 'course-id',
      } as unknown as News;

      jest.spyOn(service, 'findOne').mockResolvedValue(news);
      newsRepositoryMock.save.mockResolvedValue({
        ...news,
        targetType: null,
        targetId: null,
      });

      await service.update('news-id', {
        targetType: undefined,
        targetId: undefined,
      });

      expect(newsRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: null,
          targetId: null,
        }),
      );
    });

    it('throws BadRequestException when only targetType provided', async () => {
      const news = {
        id: 'news-id',
        targetType: null,
        targetId: null,
      } as unknown as News;

      jest.spyOn(service, 'findOne').mockResolvedValue(news);

      await expect(
        service.update('news-id', { targetType: NewsTargetType.CLASS }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when only targetId provided', async () => {
      const news = {
        id: 'news-id',
        targetType: null,
        targetId: null,
      } as unknown as News;

      jest.spyOn(service, 'findOne').mockResolvedValue(news);

      await expect(
        service.update('news-id', { targetId: 'class-id' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove', () => {
    it('removes news successfully', async () => {
      newsRepositoryMock.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('news-id')).resolves.toBeUndefined();
      expect(newsRepositoryMock.delete).toHaveBeenCalledWith('news-id');
    });

    it('throws NotFoundException when news not found', async () => {
      newsRepositoryMock.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('news-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
