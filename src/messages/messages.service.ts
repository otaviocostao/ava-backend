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

    const sender = await this.userRepository.findOne({
      where: { id: senderId },
      relations: ['roles']
    });
    if (!sender) {
      throw new NotFoundException(`Remetente com ID "${senderId}" não encontrado.`);
    }

    // Validar se o remetente é professor ou aluno
    this.validateUserRole(sender, 'remetente');

    let receiver: User | null = null;
    let classInstance: Class | null = null;

    if (receiverId) {
      if (senderId === receiverId) {
        throw new BadRequestException('Você não pode enviar uma mensagem para si mesmo.');
      }
      receiver = await this.userRepository.findOne({
        where: { id: receiverId },
        relations: ['roles']
      });
      if (!receiver) {
        throw new NotFoundException(`Destinatário com ID "${receiverId}" não encontrado.`);
      }

      // Validar se o destinatário possui alguma role válida
      this.validateUserRole(receiver, 'destinatário');

      // Validar regras de comunicação entre perfis
      await this.validateCommunicationRules(sender, receiver);
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
      'Você não tem permissão para visualizar as mensagens desta turma.',
    );

    return this.messageRepository.find({
      where: { class: { id: classId } },
      relations: ['sender'],
      order: { sentAt: 'ASC' },
    });
  }

  /**
   * Retorna um resumo da caixa de entrada do usuário com conversas diretas (sem turma).
   * Inclui o último conteúdo e contagem de não lidas por interlocutor.
   */
  async getInboxSummaries(userId: string): Promise<Array<{
    otherUser: Pick<User, 'id' | 'name' | 'email'>;
    lastMessage: Pick<Message, 'id' | 'content' | 'sentAt' | 'isRead'>;
    unreadCount: number;
  }>> {
    // Busca mensagens diretas (sem turma) envolvendo o usuário
    const messages = await this.messageRepository.find({
      where: [
        { class: null, sender: { id: userId } as any },
        { class: null, receiver: { id: userId } as any },
      ] as any,
      relations: ['sender', 'receiver'],
      order: { sentAt: 'DESC' },
    });

    type Summary = {
      otherUser: Pick<User, 'id' | 'name' | 'email'>;
      lastMessage: Pick<Message, 'id' | 'content' | 'sentAt' | 'isRead'>;
      unreadCount: number;
    };

    const map = new Map<string, Summary>();

    for (const m of messages) {
      const isReceiver = m.receiver?.id === userId;
      const other = isReceiver ? m.sender : m.receiver;
      if (!other) continue;
      const key = other.id;

      // Primeiro encontrado é o último (ordenado DESC)
      if (!map.has(key)) {
        map.set(key, {
          otherUser: { id: other.id, name: other.name, email: other.email },
          lastMessage: { id: m.id, content: m.content, sentAt: m.sentAt, isRead: m.isRead },
          unreadCount: 0,
        });
      }

      // Conta não lidas do usuário
      if (isReceiver && !m.isRead) {
        const s = map.get(key)!;
        s.unreadCount += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      return (b.lastMessage.sentAt?.getTime?.() ?? 0) - (a.lastMessage.sentAt?.getTime?.() ?? 0);
    });
  }

  async update(messageId: string, updateMessageDto: UpdateMessageDto, requestingUserId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'receiver', 'class', 'class.teacher'],
    });

    if (!message) {
      throw new NotFoundException(`Mensagem com ID "${messageId}" não encontrada.`);
    }

    if (message.sender.id !== requestingUserId) {
      throw new ForbiddenException('Você só pode editar ou revogar suas próprias mensagens.');
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
      throw new BadRequestException('Não é possível editar uma mensagem já revogada.');
    }

    let hasChanges = false;

    if (typeof content === 'string') {
      if (!content.trim()) {
        throw new BadRequestException('O conteúdo editado da mensagem não pode ser vazio.');
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
        throw new BadRequestException('Você não pode definir a si mesmo como destinatário.');
      }

      const receiver = await this.userRepository.findOneBy({ id: receiverId });
      if (!receiver) {
        throw new NotFoundException(`Destinatário com ID "${receiverId}" não encontrado.`);
      }

      message.receiver = receiver;
      message.class = null;
      hasChanges = true;
    }

    if (typeof classId !== 'undefined') {
      const classInstance = await this.ensureClassParticipation(
        classId,
        requestingUserId,
        'Você não tem permissão para publicar nesta turma.',
      );

      message.class = classInstance;
      message.receiver = null;
      hasChanges = true;
    }

    if (!message.receiver && !message.class) {
      throw new BadRequestException('Uma mensagem precisa possuir um destinatário privado ou uma turma.');
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
      throw new NotFoundException(`Mensagem com ID "${messageId}" não encontrada.`);
    }

    const isDirectReceiver = message.receiver?.id === requestingUserId;
    let isClassParticipant = false;

    if (message.class) {
      await this.ensureClassParticipation(
        message.class.id,
        requestingUserId,
        'Você não participa desta turma.',
      );
      isClassParticipant = true;
    }

    if (!isDirectReceiver && !isClassParticipant) {
      throw new ForbiddenException('Apenas destinatários podem atualizar o status da mensagem.');
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
      throw new NotFoundException(`Mensagem com ID "${messageId}" não encontrada.`);
    }

    if (message.sender.id !== requestingUserId) {
      throw new ForbiddenException('Você só pode remover suas próprias mensagens.');
    }

    await this.messageRepository.remove(message);
  }

  private async ensureClassParticipation(classId: string, userId: string, forbiddenMessage: string): Promise<Class> {
    const classInstance = await this.classRepository.findOne({ where: { id: classId }, relations: ['teacher'] });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
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

  /**
   * Valida se o usuário possui role permitida para envio de mensagens
   */
  private validateUserRole(user: User, userType: string): void {
    const hasValidRole = user.roles.some(role =>
      role.name === 'teacher' || role.name === 'student' || role.name === 'coordinator' || role.name === 'admin'
    );

    if (!hasValidRole) {
      throw new ForbiddenException(
        `Apenas professores, alunos e coordenadores podem enviar mensagens. O ${userType} deve ter role 'teacher', 'student' ou 'coordinator'.`
      );
    }
  }

  /**
   * Valida se a comunicação é permitida entre os usuários
   * - Coordenadores podem enviar para professores, alunos e outros coordenadores
   * - Professores e alunos podem se comunicar entre si (teacher <-> student)
   * - teacher <-> teacher NÃO permitido
   * - student <-> student NÃO permitido
   */
  private async validateCommunicationRules(sender: User, receiver: User): Promise<void> {
    const senderIsTeacher = sender.roles.some(role => role.name === 'teacher');
    const senderIsStudent = sender.roles.some(role => role.name === 'student');
    const senderIsCoordinator = sender.roles.some(role => role.name === 'coordinator');
    const senderIsAdmin = sender.roles.some(role => role.name === 'admin');
    const receiverIsTeacher = receiver.roles.some(role => role.name === 'teacher');
    const receiverIsStudent = receiver.roles.some(role => role.name === 'student');
    const receiverIsCoordinator = receiver.roles.some(role => role.name === 'coordinator');
    const receiverIsAdmin = receiver.roles.some(role => role.name === 'admin');

    // Administradores podem enviar para qualquer combinação
    if (senderIsAdmin) {
      return;
    }

    // Coordenadores podem enviar para qualquer combinação
    if (senderIsCoordinator) {
      return;
    }

    // Student -> Teacher/Coordinator: apenas se o destinatário pertence aos departamentos dos cursos do aluno
    if (senderIsStudent) {
      if (receiverIsTeacher) {
        const rows = await this.userRepository.query(
          `SELECT 1
           FROM student_courses sc
           JOIN courses c ON c.id = sc.course_id
           JOIN department_teachers dt ON dt.department_id = c.department_id
           WHERE sc.student_id = $1 AND dt.user_id = $2
           LIMIT 1`,
          [sender.id, receiver.id],
        );
        if (rows.length === 0) {
          throw new ForbiddenException('Aluno só pode enviar mensagens a professores de departamentos dos seus cursos.');
        }
        return;
      }
      if (receiverIsCoordinator) {
        const rows = await this.userRepository.query(
          `SELECT 1
           FROM student_courses sc
           JOIN courses c ON c.id = sc.course_id
           JOIN departments d ON d.id = c.department_id
           WHERE sc.student_id = $1 AND d.coordinator_id = $2
           LIMIT 1`,
          [sender.id, receiver.id],
        );
        if (rows.length === 0) {
          throw new ForbiddenException('Aluno só pode enviar mensagens a coordenadores dos departamentos de seus cursos.');
        }
        return;
      }
      throw new ForbiddenException('Alunos só podem enviar mensagens para professores.');
    }

    // Teacher -> Teacher: apenas se compartilham departamento
    if (senderIsTeacher && receiverIsTeacher) {
      const rows = await this.userRepository.query(
        `SELECT 1
         FROM department_teachers dt1
         JOIN department_teachers dt2 ON dt2.department_id = dt1.department_id
         WHERE dt1.user_id = $1 AND dt2.user_id = $2
         LIMIT 1`,
        [sender.id, receiver.id],
      );
      if (rows.length === 0) {
        throw new ForbiddenException('Professores só podem se comunicar com professores do mesmo departamento.');
      }
      return;
    }

    // Teacher -> Coordinator: coordenador de algum departamento do professor
    if (senderIsTeacher && receiverIsCoordinator) {
      const rows = await this.userRepository.query(
        `SELECT 1
         FROM departments d
         JOIN department_teachers dt ON dt.department_id = d.id
         WHERE dt.user_id = $1 AND d.coordinator_id = $2
         LIMIT 1`,
        [sender.id, receiver.id],
      );
      if (rows.length === 0) {
        throw new ForbiddenException('Professor só pode se comunicar com coordenadores de seus departamentos.');
      }
      return;
    }

    // Teacher -> Student: aluno em curso de departamento do professor
    if (senderIsTeacher && receiverIsStudent) {
      const rows = await this.userRepository.query(
        `SELECT 1
         FROM student_courses sc
         JOIN courses c ON c.id = sc.course_id
         JOIN department_teachers dt ON dt.department_id = c.department_id
         WHERE dt.user_id = $1 AND sc.student_id = $2
         LIMIT 1`,
        [sender.id, receiver.id],
      );
      if (rows.length === 0) {
        throw new ForbiddenException('Professor só pode se comunicar com alunos vinculados a cursos de seus departamentos.');
      }
      return;
    }

    // Demais combinações negadas
    if (receiverIsAdmin) {
      throw new ForbiddenException('Apenas administradores podem enviar mensagens para administradores.');
    }
    throw new ForbiddenException('Combinação de remetente/destinatário não permitida.');
  }
}
