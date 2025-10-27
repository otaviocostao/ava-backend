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
import { UpdateMessageDto } from './dto/update-message.dto';
import { MarkMessageReadDto } from './dto/mark-message-read.dto';

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
      classInstance = await this.ensureClassParticipation(
        classId,
        senderId,
        'Você não tem permissão para enviar mensagens nesta turma.',
      );
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
    await this.ensureClassParticipation(
      classId,
      requestingUserId,
      'VocǦ nǜo tem permissǜo para visualizar as mensagens desta turma.',
    );

    return this.messageRepository.find({
      where: { class: { id: classId } },
      relations: ['sender'],
      order: { sentAt: 'ASC' },
    });
  }

  async update(messageId: string, updateMessageDto: UpdateMessageDto, requestingUserId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'receiver', 'class', 'class.teacher'],
    });

    if (!message) {
      throw new NotFoundException(`Mensagem com ID "${messageId}" nǜo encontrada.`);
    }

    if (message.sender.id !== requestingUserId) {
      throw new ForbiddenException('VocǦ s�� pode editar ou revogar suas pr��prias mensagens.');
    }

    const { content, receiverId, classId, recall } = updateMessageDto;

    if (recall) {
      if (!message.isRecalled) {
        message.isRecalled = true;
        message.recalledAt = new Date();
      }
      return this.messageRepository.save(message);
    }

    if (message.isRecalled) {
      throw new BadRequestException('Nǜo �% poss��vel editar uma mensagem j�� revogada.');
    }

    let hasChanges = false;

    if (typeof content === 'string') {
      if (!content.trim()) {
        throw new BadRequestException('O conteǧdo editado da mensagem nǜo pode ser vazio.');
      }

      if (content !== message.content) {
        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        hasChanges = true;
      }
    }

    if (typeof receiverId !== 'undefined') {
      if (receiverId === requestingUserId) {
        throw new BadRequestException('VocǦ nǜo pode definir a si mesmo como destinatǭrio.');
      }

      const receiver = await this.userRepository.findOneBy({ id: receiverId });
      if (!receiver) {
        throw new NotFoundException(`Destinatǭrio com ID "${receiverId}" nǜo encontrado.`);
      }

      message.receiver = receiver;
      message.class = null;
      hasChanges = true;
    }

    if (typeof classId !== 'undefined') {
      const classInstance = await this.ensureClassParticipation(
        classId,
        requestingUserId,
        'VocǦ nǜo tem permissǜo para publicar nesta turma.',
      );

      message.class = classInstance;
      message.receiver = null;
      hasChanges = true;
    }

    if (!message.receiver && !message.class) {
      throw new BadRequestException('Uma mensagem precisa possuir um destinatǭrio privado ou uma turma.');
    }

    if (!hasChanges) {
      return message;
    }

    return this.messageRepository.save(message);
  }

  async markAsRead(
    messageId: string,
    requestingUserId: string,
    markMessageReadDto: MarkMessageReadDto,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'receiver', 'class', 'class.teacher'],
    });

    if (!message) {
      throw new NotFoundException(`Mensagem com ID "${messageId}" nǜo encontrada.`);
    }

    const isDirectReceiver = message.receiver?.id === requestingUserId;
    let isClassParticipant = false;

    if (message.class) {
      await this.ensureClassParticipation(
        message.class.id,
        requestingUserId,
        'VocǦ nǜo participa desta turma.',
      );
      isClassParticipant = true;
    }

    if (!isDirectReceiver && !isClassParticipant) {
      throw new ForbiddenException('Apenas destinatǭrios podem atualizar o status da mensagem.');
    }

    const payload = markMessageReadDto ?? {};
    const shouldMarkAsRead = payload.read ?? true;
    let hasChanges = false;

    if (typeof payload.read !== 'undefined') {
      if (message.isRead !== payload.read) {
        message.isRead = payload.read;
        message.readAt = payload.read ? new Date() : null;
        hasChanges = true;
      }
    } else if (!message.isRead && shouldMarkAsRead) {
      message.isRead = true;
      message.readAt = new Date();
      hasChanges = true;
    }

    if (typeof payload.archived !== 'undefined' && message.isArchived !== payload.archived) {
      message.isArchived = payload.archived;
      message.archivedAt = payload.archived ? new Date() : null;
      hasChanges = true;
    }

    if (!hasChanges) {
      return message;
    }

    return this.messageRepository.save(message);
  }

  async remove(messageId: string, requestingUserId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException(`Mensagem com ID "${messageId}" nǜo encontrada.`);
    }

    if (message.sender.id !== requestingUserId) {
      throw new ForbiddenException('VocǦ s�� pode remover suas pr��prias mensagens.');
    }

    await this.messageRepository.remove(message);
  }

  private async ensureClassParticipation(classId: string, userId: string, forbiddenMessage: string): Promise<Class> {
    const classInstance = await this.classRepository.findOne({ where: { id: classId }, relations: ['teacher'] });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" nǜo encontrada.`);
    }

    const isTeacher = classInstance.teacher?.id === userId;
    if (isTeacher) {
      return classInstance;
    }

    const isEnrolled = await this.enrollmentRepository.findOneBy({
      class: { id: classId },
      student: { id: userId },
    });

    if (!isEnrolled) {
      throw new ForbiddenException(forbiddenMessage);
    }

    return classInstance;
  }
}

