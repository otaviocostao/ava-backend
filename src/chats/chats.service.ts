import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Message } from 'src/messages/entities/message.entity';
import { User } from 'src/users/entities/user.entity';

export interface ChatThread {
  id: string; // thread id (usaremos o classId)
  classId: string;
  professorName: string;
  discipline: string;
  lastMessageAt: string | null;
  unreadCount?: number;
}

export interface ChatMessageDTO {
  id: string;
  author: 'prof' | 'aluno';
  content: string;
  sentAt: string;
}

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getThreadsForStudent(studentId: string, requestingUserId: string): Promise<ChatThread[]> {
    if (studentId !== requestingUserId) {
      throw new ForbiddenException('Você só pode visualizar suas próprias conversas.');
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class', 'class.teacher', 'class.discipline'],
    });

    const threads: ChatThread[] = [];
    for (const enr of enrollments) {
      const classId = enr.class?.id;
      if (!classId) continue;

      const lastMsg = await this.messageRepository.findOne({
        where: { class: { id: classId } },
        order: { sentAt: 'DESC' },
      });

      threads.push({
        id: classId,
        classId,
        professorName: enr.class?.teacher?.name || 'Professor não definido',
        discipline: enr.class?.discipline?.name || 'Disciplina',
        lastMessageAt: lastMsg?.sentAt?.toISOString?.() ?? null,
        unreadCount: 0,
      });
    }
    return threads.sort((a, b) => {
      const aDate = a.lastMessageAt ? +new Date(a.lastMessageAt) : 0;
      const bDate = b.lastMessageAt ? +new Date(b.lastMessageAt) : 0;
      return bDate - aDate;
    });
  }

  async getClassMessagesForStudent(studentId: string, classId: string, requestingUserId: string): Promise<ChatMessageDTO[]> {
    await this.ensureClassParticipation(classId, requestingUserId);
    if (studentId !== requestingUserId) {
      throw new ForbiddenException('Você só pode visualizar suas próprias conversas de turma.');
    }

    const classInstance = await this.classRepository.findOne({
      where: { id: classId },
      relations: ['teacher'],
    });
    if (!classInstance) {
      throw new NotFoundException('Turma não encontrada.');
    }

    const messages = await this.messageRepository.find({
      where: { class: { id: classId } },
      relations: ['sender'],
      order: { sentAt: 'ASC' },
    });

    return messages.map((m) => ({
      id: m.id,
      author: m.sender?.id === classInstance.teacher?.id ? 'prof' : 'aluno',
      content: m.content,
      sentAt: m.sentAt?.toISOString?.() ?? new Date().toISOString(),
    }));
  }

  async sendClassMessageAsStudent(studentId: string, classId: string, content: string, requestingUserId: string): Promise<ChatMessageDTO> {
    if (!content || !content.trim()) {
      throw new ForbiddenException('Mensagem vazia não é permitida.');
    }
    await this.ensureClassParticipation(classId, requestingUserId);
    if (studentId !== requestingUserId) {
      throw new ForbiddenException('Você só pode enviar mensagens pelas suas próprias conversas de turma.');
    }

    const sender = await this.userRepository.findOne({
      where: { id: requestingUserId },
      relations: ['roles'],
    });
    if (!sender) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    const classInstance = await this.classRepository.findOne({ where: { id: classId }, relations: ['teacher'] });
    if (!classInstance) {
      throw new NotFoundException('Turma não encontrada.');
    }

    const newMsg = this.messageRepository.create({
      content: content.trim(),
      sender,
      class: classInstance,
      receiver: null,
    });
    const saved = await this.messageRepository.save(newMsg);

    return {
      id: saved.id,
      author: saved.sender?.id === classInstance.teacher?.id ? 'prof' : 'aluno',
      content: saved.content,
      sentAt: saved.sentAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private async ensureClassParticipation(classId: string, userId: string): Promise<void> {
    const classInstance = await this.classRepository.findOne({ where: { id: classId }, relations: ['teacher'] });
    if (!classInstance) {
      throw new NotFoundException('Turma não encontrada.');
    }
    if (classInstance.teacher?.id === userId) {
      return;
    }
    const isEnrolled = await this.enrollmentRepository.findOne({
      where: { class: { id: classId }, student: { id: userId } },
    });
    if (!isEnrolled) {
      throw new ForbiddenException('Você não participa desta turma.');
    }
  }
}


