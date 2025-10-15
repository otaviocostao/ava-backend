import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ForumPost } from './entities/forum-post.entity';
import { IsNull, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Forum } from 'src/forums/entities/forum.entity';

@Injectable()
export class ForumPostsService {
  
  constructor(
      @InjectRepository(ForumPost)
      private readonly forumPostRepository: Repository<ForumPost>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(Forum)
      private readonly forumRepository: Repository<Forum>,
    ) {}

  async create(createForumPostDto: CreateForumPostDto): Promise<ForumPost> {
    const { userId, forumId, parentPostId, content } = createForumPostDto;

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }

    const forum = await this.forumRepository.findOneBy({ id: forumId });
    if (!forum) {
      throw new NotFoundException(`Fórum com ID "${forumId}" não encontrado.`);
    }

    let parentPost: ForumPost | null = null;
    if (parentPostId) {
      parentPost = await this.forumPostRepository.findOneBy({ id: parentPostId });
      if (!parentPost) {
        throw new NotFoundException(`Post pai com ID "${parentPostId}" não encontrado.`);
      }
    }

    const newForumPost = this.forumPostRepository.create({
      content,
      user,
      forum,
      parentPost,
    });

    return this.forumPostRepository.save(newForumPost);
  }

  async findAllByForum(forumId: string): Promise<ForumPost[]> {
    return this.forumPostRepository.find({
      where: {
        forum: { id: forumId },
        parentPost: IsNull(),
      },
      relations: [
        'user',
        'replies',
        'replies.user',
        'replies.replies'
      ],
      order: {
        postedAt: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<ForumPost> {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['user', 'forum', 'parentPost', 'replies'],
    });

    if (!post) {
      throw new NotFoundException(`Post com ID "${id}" não encontrado.`);
    }
    return post;
  }

  async update(
    id: string,
    updateForumPostDto: UpdateForumPostDto,
    requestingUserId: string,
  ): Promise<ForumPost> {
    const post = await this.findOne(id);

    if (post.user.id !== requestingUserId) {
      throw new UnauthorizedException('Você não tem permissão para editar este post.');
    }

    this.forumPostRepository.merge(post, updateForumPostDto);
    return this.forumPostRepository.save(post);
  }

  async remove(id: string, requestingUserId: string): Promise<void> {
    const post = await this.findOne(id);

    if (post.user.id !== requestingUserId) {
      throw new UnauthorizedException('Você não tem permissão para remover este post.');
    }
    
    const result = await this.forumPostRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Post com ID "${id}" não encontrado.`);
    }
  }
}
