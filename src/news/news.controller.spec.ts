import { Test, TestingModule } from '@nestjs/testing';
import { NewsTargetType } from '../common/enums/news-target-type.enum';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { News } from './entities/news.entity';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

type NewsServiceMock = jest.Mocked<
  Pick<
    NewsService,
    'create' | 'findAll' | 'findOne' | 'update' | 'remove'
  >
>;

const createNewsServiceMock = (): NewsServiceMock => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('NewsController', () => {
  let controller: NewsController;
  let newsServiceMock: NewsServiceMock;

  beforeEach(async () => {
    newsServiceMock = createNewsServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsController],
      providers: [
        {
          provide: NewsService,
          useValue: newsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<NewsController>(NewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a news entry', async () => {
    const dto: CreateNewsDto = {
      title: 'Title',
      content: 'Body',
      publishedById: 'user-id',
      targetType: NewsTargetType.COURSE,
      targetId: 'course-id',
    };
    const news = { id: 'news-id', ...dto } as unknown as News;

    newsServiceMock.create.mockResolvedValue(news);

    const result = await controller.create(dto);

    expect(newsServiceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(news);
  });

  it('should list news entries', async () => {
    const query = { targetType: NewsTargetType.GLOBAL };
    const newsList = [{ id: 'news-id' }] as unknown as News[];

    newsServiceMock.findAll.mockResolvedValue(newsList);

    const result = await controller.findAll(query);

    expect(newsServiceMock.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(newsList);
  });

  it('should retrieve a single news entry', async () => {
    const news = { id: 'news-id' } as News;
    newsServiceMock.findOne.mockResolvedValue(news);

    const result = await controller.findOne('news-id');

    expect(newsServiceMock.findOne).toHaveBeenCalledWith('news-id');
    expect(result).toEqual(news);
  });

  it('should update a news entry', async () => {
    const dto: UpdateNewsDto = { title: 'Updated title' };
    const updated = { id: 'news-id', title: 'Updated title' } as News;

    newsServiceMock.update.mockResolvedValue(updated);

    const result = await controller.update('news-id', dto);

    expect(newsServiceMock.update).toHaveBeenCalledWith('news-id', dto);
    expect(result).toEqual(updated);
  });

  it('should remove a news entry', async () => {
    newsServiceMock.remove.mockResolvedValue(undefined);

    await expect(controller.remove('news-id')).resolves.toBeUndefined();
    expect(newsServiceMock.remove).toHaveBeenCalledWith('news-id');
  });

  it('should propagate errors from service when creating news', async () => {
    const dto: CreateNewsDto = {
      title: 'Title',
      content: 'Body',
      publishedById: 'user-id',
    };
    const error = new Error('create failed');

    newsServiceMock.create.mockRejectedValue(error);

    await expect(controller.create(dto)).rejects.toThrow(error);
  });

  it('should propagate errors from service when listing news', async () => {
    const error = new Error('list failed');

    newsServiceMock.findAll.mockRejectedValue(error);

    await expect(
      controller.findAll({ targetType: NewsTargetType.GLOBAL }),
    ).rejects.toThrow(error);
  });

  it('should propagate errors from service when fetching news', async () => {
    const error = new Error('not found');

    newsServiceMock.findOne.mockRejectedValue(error);

    await expect(controller.findOne('news-id')).rejects.toThrow(error);
  });

  it('should propagate errors from service when updating news', async () => {
    const error = new Error('update failed');

    newsServiceMock.update.mockRejectedValue(error);

    await expect(
      controller.update('news-id', { title: 'oops' }),
    ).rejects.toThrow(error);
  });

  it('should propagate errors from service when removing news', async () => {
    const error = new Error('remove failed');

    newsServiceMock.remove.mockRejectedValue(error);

    await expect(controller.remove('news-id')).rejects.toThrow(error);
  });
});
