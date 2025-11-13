import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Forum } from './entities/forum.entity';
import { Repository } from 'typeorm';
import { Class } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(Forum)
    private readonly forumRepository: Repository<Forum>,
    
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ){}

  async create(createForumDto: CreateForumDto) : Promise<Forum> {
    const { classId, userId } = createForumDto;

    const classInstance = await this.classRepository.findOneBy({ id: classId });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    const creator = await this.userRepository.findOneBy({ id: userId });
    if (!creator) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }

    const newForum = this.forumRepository.create({
      ...createForumDto,
      class: { id: classId },
      createdBy: creator,
    });

    return this.forumRepository.save(newForum);
  }

  findAll() {
    return this.forumRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['createdBy'],
    });
  }

  async findOne(id: string) : Promise<Forum> {
    const forum = await this.forumRepository.findOne({
      where: { id },
      relations: ['class', 'class.discipline'],
    });
    if (!forum) {
      throw new NotFoundException(`Fórum com ID "${id}" não encontrado.`);
    }
    return forum;
  }

  async update(id: string, updateForumDto: UpdateForumDto) : Promise<Forum> {
    const forum = await this.forumRepository.preload({
      id: id,
      ...updateForumDto,
    });

    if (!forum) {
      throw new NotFoundException(`Fórum com ID "${id}" não encontrado.`);
    }

    return await this.forumRepository.save(forum);
  }

  async remove(id: string) : Promise<void> {
    const result = await this.forumRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Fórum com ID "${id}" não encontrado.`);
    }
  }

  async findByClassId(classId: string): Promise<Forum[]> {
    const forums = await this.forumRepository.find({
      where: { class: { id: classId } },
      order: { createdAt: 'DESC' },
      relations: ['createdBy'],
    });

    if (!forums) {
      throw new NotFoundException(`Fóruns da turma com ID "${classId}" não encontrados.`);
    }
    
    return forums;
  }
}
