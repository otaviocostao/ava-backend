import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    senderId: string,
  ): Promise<Message> {
    const { content, receiverId, classId } = createMessageDto;

    const sender = await this.userRepository.findOneBy({ id: senderId });
    if (!sender) {
      throw new NotFoundException(`Remetente com ID "${senderId}" não encontrado.`);
    }

    let receiver: User | null = null;
    let classInstance: Class | null = null;

    if (receiverId) {
      if (senderId === receiverId) {
        throw new BadRequestException('Você não pode enviar uma mensagem para si mesmo.');
      }
      receiver = await this.userRepository.findOneBy({ id: receiverId });
      if (!receiver) {
        throw new NotFoundException(`Destinatário com ID "${receiverId}" não encontrado.`);
      }
    }

    if (classId) {
      classInstance = await this.classRepository.findOne({ where: { id: classId }, relations: ['teacher'] });
      if (!classInstance) {
        throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
      }

      const isTeacher = classInstance.teacher?.id === senderId;
      const isEnrolled = await this.enrollmentRepository.findOneBy({
        class: { id: classId },
        student: { id: senderId },
      });

      if (!isTeacher && !isEnrolled) {
        throw new ForbiddenException('Você não tem permissão para enviar mensagens nesta turma.');
      }
    }

    const newMessage = this.messageRepository.create({
      content,
      sender,
      receiver,
      class: classInstance,
    });

    return this.messageRepository.save(newMessage);
  }

  async findConversation(user1Id: string, user2Id: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: [
        { sender: { id: user1Id }, receiver: { id: user2Id } },
        { sender: { id: user2Id }, receiver: { id: user1Id } },
      ],
      relations: ['sender', 'receiver'],
      order: { sentAt: 'ASC' },
    });
  }

  async findClassMessages(classId: string, requestingUserId: string): Promise<Message[]> {
    const classInstance = await this.classRepository.findOne({ where: { id: classId }, relations: ['teacher'] });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    const isTeacher = classInstance.teacher?.id === requestingUserId;
    const isEnrolled = await this.enrollmentRepository.findOneBy({
      class: { id: classId },
      student: { id: requestingUserId },
    });

    if (!isTeacher && !isEnrolled) {
      throw new ForbiddenException('Você não tem permissão para visualizar as mensagens desta turma.');
    }

    return this.messageRepository.find({
      where: { class: { id: classId } },
      relations: ['sender'],
      order: { sentAt: 'ASC' },
    });
  }

  async remove(messageId: string, requestingUserId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException(`Mensagem com ID "${messageId}" não encontrada.`);
    }

    if (message.sender.id !== requestingUserId) {
      throw new ForbiddenException('Você só pode remover suas próprias mensagens.');
    }

    await this.messageRepository.remove(message);
  }
}