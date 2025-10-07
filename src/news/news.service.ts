import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsTargetType } from '../common/enums/news-target-type.enum';
import { User } from '../users/entities/user.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { News } from './entities/news.entity';

interface FindNewsQuery {
  targetType?: NewsTargetType;
  targetId?: string;
  publishedById?: string;
}

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createNewsDto: CreateNewsDto): Promise<News> {
    this.ensureTargetCombination(
      createNewsDto.targetType,
      createNewsDto.targetId,
    );

    const publisher = await this.findPublisher(createNewsDto.publishedById);

    const news = this.newsRepository.create({
      title: createNewsDto.title,
      content: createNewsDto.content,
      publishedBy: publisher,
      publishedAt: createNewsDto.publishedAt
        ? new Date(createNewsDto.publishedAt)
        : undefined,
      targetType: createNewsDto.targetType ?? null,
      targetId: createNewsDto.targetId ?? null,
    });

    return this.newsRepository.save(news);
  }

  findAll(query: FindNewsQuery): Promise<News[]> {
    const where: Record<string, unknown> = {};

    if (query.targetType) {
      where.targetType = query.targetType;
    }

    if (query.targetId) {
      where.targetId = query.targetId;
    }

    if (query.publishedById) {
      where.publishedBy = { id: query.publishedById };
    }

    return this.newsRepository.find({
      where,
      relations: ['publishedBy'],
      order: { publishedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<News> {
    const news = await this.newsRepository.findOne({
      where: { id },
      relations: ['publishedBy'],
    });

    if (!news) {
      throw new NotFoundException(`Noticia com o ID '${id}' nao encontrada.`);
    }

    return news;
  }

  async update(id: string, updateNewsDto: UpdateNewsDto): Promise<News> {
    const news = await this.findOne(id);

    if (updateNewsDto.publishedById) {
      news.publishedBy = await this.findPublisher(updateNewsDto.publishedById);
    }

    const hasTargetTypeKey = Object.prototype.hasOwnProperty.call(
      updateNewsDto,
      'targetType',
    );
    const hasTargetIdKey = Object.prototype.hasOwnProperty.call(
      updateNewsDto,
      'targetId',
    );

    if (hasTargetTypeKey || hasTargetIdKey) {
      const nextTargetType = hasTargetTypeKey
        ? updateNewsDto.targetType ?? null
        : news.targetType ?? null;
      const nextTargetId = hasTargetIdKey
        ? updateNewsDto.targetId ?? null
        : news.targetId ?? null;

      this.ensureTargetCombination(nextTargetType, nextTargetId);

      news.targetType = nextTargetType;
      news.targetId = nextTargetId;
    }

    if (updateNewsDto.publishedAt !== undefined) {
      news.publishedAt = updateNewsDto.publishedAt
        ? new Date(updateNewsDto.publishedAt)
        : news.publishedAt;
    }

    if (updateNewsDto.title !== undefined) {
      news.title = updateNewsDto.title;
    }

    if (updateNewsDto.content !== undefined) {
      news.content = updateNewsDto.content;
    }

    return this.newsRepository.save(news);
  }

  async remove(id: string): Promise<void> {
    const result = await this.newsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Noticia com o ID '${id}' nao encontrada.`);
    }
  }

  private ensureTargetCombination(
    targetType?: NewsTargetType,
    targetId?: string,
  ) {
    const hasType = targetType !== undefined && targetType !== null;
    const hasId = targetId !== undefined && targetId !== null;

    if (hasType !== hasId) {
      throw new BadRequestException(
        'targetType e targetId devem ser fornecidos em conjunto.',
      );
    }
  }

  private async findPublisher(publishedById: string): Promise<User> {
    const publisher = await this.userRepository.findOneBy({ id: publishedById });

    if (!publisher) {
      throw new NotFoundException(
        `Usuario com o ID '${publishedById}' nao encontrado.`,
      );
    }

    return publisher;
  }
}
