import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { ExamAttempt } from './entities/exam-attempt.entity';
import { ExamAnswer } from './entities/exam-answer.entity';
import { Activity } from '../activities/entities/activity.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateExamQuestionDto } from './dto/create-exam-question.dto';
import { UpdateExamQuestionDto } from './dto/update-exam-question.dto';
import { StartExamAttemptDto } from './dto/start-exam-attempt.dto';
import { SaveExamAnswerDto } from './dto/save-exam-answer.dto';
import { SubmitExamAttemptDto } from './dto/submit-exam-attempt.dto';
import { GradeExamAnswerDto } from './dto/grade-exam-answer.dto';
import { ExamQuestionType } from '../common/enums/exam-question-type.enum';
import { ExamAttemptStatus } from '../common/enums/exam-attempt-status.enum';
import { ActivityType } from '../common/enums/activity-type.enum';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamQuestion)
    private readonly examQuestionRepository: Repository<ExamQuestion>,
    @InjectRepository(ExamAttempt)
    private readonly examAttemptRepository: Repository<ExamAttempt>,
    @InjectRepository(ExamAnswer)
    private readonly examAnswerRepository: Repository<ExamAnswer>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
  ) {}

  // ========== CRUD DE PROVAS ==========

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    const { activityId, ...examData } = createExamDto;

    // Verificar se a atividade existe e é do tipo VIRTUAL_EXAM
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['class'],
    });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID '${activityId}' não encontrada.`);
    }

    if (activity.type !== ActivityType.VIRTUAL_EXAM) {
      throw new BadRequestException(
        `A atividade deve ser do tipo '${ActivityType.VIRTUAL_EXAM}'. Tipo atual: '${activity.type}'`,
      );
    }

    // Verificar se já existe uma prova para esta atividade
    const existingExam = await this.examRepository.findOne({
      where: { activity: { id: activityId } },
    });

    if (existingExam) {
      throw new BadRequestException('Já existe uma prova virtual para esta atividade.');
    }

    const exam = this.examRepository.create({
      ...examData,
      activity,
    });

    return this.examRepository.save(exam);
  }

  async findAll(): Promise<Exam[]> {
    return this.examRepository.find({
      relations: ['activity', 'activity.class', 'questions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: ['activity', 'activity.class', 'questions', 'questions.answers'],
    });

    if (!exam) {
      throw new NotFoundException(`Prova com ID '${id}' não encontrada.`);
    }

    // Ordenar questões manualmente
    if (exam.questions) {
      exam.questions.sort((a, b) => a.order - b.order);
    }

    return exam;
  }

  async update(id: string, updateExamDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id);

    Object.assign(exam, updateExamDto);

    return this.examRepository.save(exam);
  }

  async remove(id: string): Promise<void> {
    const exam = await this.findOne(id);
    await this.examRepository.remove(exam);
  }

  // ========== CRUD DE QUESTÕES ==========

  async createQuestion(createQuestionDto: CreateExamQuestionDto): Promise<ExamQuestion> {
    const { examId, type, options, ...questionData } = createQuestionDto;

    // Verificar se a prova existe
    const exam = await this.examRepository.findOne({ 
      where: { id: examId },
      relations: ['activity'],
    });
    if (!exam) {
      throw new NotFoundException(`Prova com ID '${examId}' não encontrada.`);
    }

    // Validações específicas por tipo
    if (type === ExamQuestionType.MULTIPLE_CHOICE) {
      if (!options || options.length < 2) {
        throw new BadRequestException(
          'Questões de múltipla escolha devem ter pelo menos 2 alternativas.',
        );
      }

      const correctCount = options.filter((opt) => opt.is_correct).length;
      if (correctCount !== 1) {
        throw new BadRequestException(
          'Questões de múltipla escolha devem ter exatamente 1 alternativa correta.',
        );
      }

      // Definir correctAnswer como o ID da alternativa correta
      const correctOption = options.find((opt) => opt.is_correct);
      if (!correctOption) {
        throw new BadRequestException('Nenhuma alternativa correta encontrada.');
      }
      questionData.correctAnswer = { option_id: correctOption.id };
    } else if (type === ExamQuestionType.ESSAY) {
      // Para questões dissertativas, options deve ser null
      questionData.correctAnswer = null;
    }

    const question = this.examQuestionRepository.create({
      ...questionData,
      exam,
      type,
      options: type === ExamQuestionType.MULTIPLE_CHOICE ? options : null,
    });

    return this.examQuestionRepository.save(question);
  }

  async findAllQuestions(examId: string): Promise<ExamQuestion[]> {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException(`Prova com ID '${examId}' não encontrada.`);
    }

    return this.examQuestionRepository.find({
      where: { exam: { id: examId } },
      order: { order: 'ASC' },
    });
  }

  async findOneQuestion(id: string): Promise<ExamQuestion> {
    const question = await this.examQuestionRepository.findOne({
      where: { id },
      relations: ['exam'],
    });

    if (!question) {
      throw new NotFoundException(`Questão com ID '${id}' não encontrada.`);
    }

    return question;
  }

  async updateQuestion(id: string, updateQuestionDto: UpdateExamQuestionDto): Promise<ExamQuestion> {
    const question = await this.findOneQuestion(id);
    const { type, options, ...updateData } = updateQuestionDto;

    // Se o tipo está sendo atualizado ou se options está sendo atualizado
    const finalType = type || question.type;
    const finalOptions = options !== undefined ? options : question.options;

    // Validações se for múltipla escolha
    if (finalType === ExamQuestionType.MULTIPLE_CHOICE) {
      if (finalOptions && finalOptions.length < 2) {
        throw new BadRequestException(
          'Questões de múltipla escolha devem ter pelo menos 2 alternativas.',
        );
      }

      if (finalOptions) {
        const correctCount = finalOptions.filter((opt) => opt.is_correct).length;
        if (correctCount !== 1) {
          throw new BadRequestException(
            'Questões de múltipla escolha devem ter exatamente 1 alternativa correta.',
          );
        }

        const correctOption = finalOptions.find((opt) => opt.is_correct);
        if (!correctOption) {
          throw new BadRequestException('Nenhuma alternativa correta encontrada.');
        }
        updateData.correctAnswer = { option_id: correctOption.id };
      }
    }

    Object.assign(question, updateData);
    if (type) question.type = type;
    if (options !== undefined) question.options = finalOptions;

    return this.examQuestionRepository.save(question);
  }

  async removeQuestion(id: string): Promise<void> {
    const question = await this.findOneQuestion(id);
    await this.examQuestionRepository.remove(question);
  }

  // ========== TENTATIVAS DE PROVA ==========

  async startAttempt(examId: string, studentId: string): Promise<ExamAttempt> {
    // Verificar se a prova existe
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['activity', 'activity.class'],
    });

    if (!exam) {
      throw new NotFoundException(`Prova com ID '${examId}' não encontrada.`);
    }

    // Verificar se o aluno está matriculado na turma
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: studentId },
        class: { id: exam.activity.class.id },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'Aluno não está matriculado na turma desta prova.',
      );
    }

    // Verificar se a prova está disponível (entre startDate e dueDate)
    const now = new Date();
    if (exam.activity.startDate) {
      const startDate = new Date(exam.activity.startDate);
      if (now < startDate) {
        throw new BadRequestException(
          `A prova ainda não está disponível. Início: ${startDate.toLocaleString('pt-BR')}`,
        );
      }
    }
    if (exam.activity.dueDate) {
      const dueDate = new Date(exam.activity.dueDate);
      if (now > dueDate) {
        throw new BadRequestException(
          `O prazo para iniciar a prova expirou. Término: ${dueDate.toLocaleString('pt-BR')}`,
        );
      }
    }

    // Verificar se já existe uma tentativa (com lock para evitar race condition)
    const existingAttempt = await this.examAttemptRepository.findOne({
      where: { exam: { id: examId }, student: { id: studentId } },
      relations: ['exam', 'student'],
    });

    if (existingAttempt) {
      if (existingAttempt.status === ExamAttemptStatus.IN_PROGRESS) {
        return existingAttempt; // Retorna a tentativa em andamento
      }
      throw new BadRequestException('Aluno já possui uma tentativa finalizada para esta prova.');
    }

    // Buscar aluno
    const student = await this.userRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Aluno com ID '${studentId}' não encontrado.`);
    }

    // Criar nova tentativa com tratamento de erro de constraint única
    try {
      const attempt = this.examAttemptRepository.create({
        exam,
        student,
        startedAt: new Date(),
        status: ExamAttemptStatus.IN_PROGRESS,
      });

      return await this.examAttemptRepository.save(attempt);
    } catch (error: any) {
      // Se der erro de constraint única, significa que outra requisição criou a tentativa
      // Verificar novamente e retornar a tentativa existente
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        const retryAttempt = await this.examAttemptRepository.findOne({
          where: { exam: { id: examId }, student: { id: studentId } },
          relations: ['exam', 'student'],
        });
        
        if (retryAttempt) {
          return retryAttempt;
        }
      }
      throw error;
    }
  }

  async saveAnswer(attemptId: string, saveAnswerDto: SaveExamAnswerDto, studentId: string): Promise<ExamAnswer> {
    const { questionId, answerData } = saveAnswerDto;

    // Verificar se a tentativa existe e pertence ao aluno
    const attempt = await this.examAttemptRepository.findOne({
      where: { id: attemptId, student: { id: studentId } },
      relations: ['exam', 'exam.activity', 'exam.questions'],
    });

    if (!attempt) {
      throw new NotFoundException(`Tentativa com ID '${attemptId}' não encontrada.`);
    }

    if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Não é possível salvar resposta em uma tentativa finalizada.');
    }

    // Verificar se a questão pertence à prova
    const question = await this.examQuestionRepository.findOne({
      where: { id: questionId, exam: { id: attempt.exam.id } },
    });

    if (!question) {
      throw new NotFoundException(
        `Questão com ID '${questionId}' não pertence a esta prova.`,
      );
    }

    // Verificar se já existe resposta
    let answer = await this.examAnswerRepository.findOne({
      where: { attempt: { id: attemptId }, question: { id: questionId } },
    });

    if (answer) {
      answer.answerData = answerData;
    } else {
      answer = this.examAnswerRepository.create({
        attempt,
        question,
        answerData,
      });
    }

    return this.examAnswerRepository.save(answer);
  }

  async submitAttempt(submitDto: SubmitExamAttemptDto, studentId: string): Promise<ExamAttempt> {
    const { attemptId, answers } = submitDto;

    // Verificar se a tentativa existe e pertence ao aluno
    const attempt = await this.examAttemptRepository.findOne({
      where: { id: attemptId, student: { id: studentId } },
      relations: ['exam', 'exam.activity', 'exam.activity.class', 'exam.questions', 'student'],
    });

    if (!attempt) {
      throw new NotFoundException(`Tentativa com ID '${attemptId}' não encontrada.`);
    }

    if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Esta tentativa já foi finalizada.');
    }

    // Salvar todas as respostas fornecidas
    if (answers && answers.length > 0) {
      for (const answerDto of answers) {
        await this.saveAnswer(attemptId, answerDto, studentId);
      }
    }

    // Calcular tempo gasto
    const timeSpent = Math.floor(
      (new Date().getTime() - attempt.startedAt.getTime()) / (1000 * 60),
    );

    // Verificar tempo limite
    if (attempt.exam.timeLimitMinutes && timeSpent > attempt.exam.timeLimitMinutes) {
      throw new BadRequestException('Tempo limite da prova excedido.');
    }

    attempt.submittedAt = new Date();
    attempt.timeSpentMinutes = timeSpent;
    attempt.status = ExamAttemptStatus.SUBMITTED;

    // Se auto_grade está habilitado, corrigir automaticamente
    if (attempt.exam.autoGrade) {
      await this.autoGradeAttempt(attempt);
    }

    const savedAttempt = await this.examAttemptRepository.save(attempt);

    // Criar registro de nota (Grade) se a prova foi corrigida
    if (savedAttempt.score !== null) {
      // Buscar attempt novamente com todas as relações necessárias
      const attemptWithRelations = await this.examAttemptRepository.findOne({
        where: { id: savedAttempt.id },
        relations: ['exam', 'exam.activity', 'exam.activity.class', 'student'],
      });
      
      if (attemptWithRelations) {
        await this.createGradeFromAttempt(attemptWithRelations);
      }
    }

    // Retornar attempt com todas as relações, incluindo respostas
    const attemptWithAnswers = await this.examAttemptRepository.findOne({
      where: { id: savedAttempt.id },
      relations: [
        'exam',
        'exam.activity',
        'exam.activity.class',
        'exam.questions',
        'student',
        'answers',
        'answers.question',
      ],
    });

    if (attemptWithAnswers) {
      // Adicionar questionId em cada resposta e garantir que answerData está como objeto
      if (attemptWithAnswers.answers) {
        attemptWithAnswers.answers.forEach(answer => {
          if (answer.question) {
            (answer as any).questionId = answer.question.id;
          }
          // Garantir que answerData está como objeto
          if (answer.answerData && typeof answer.answerData === 'string') {
            try {
              answer.answerData = JSON.parse(answer.answerData);
            } catch (e) {
              console.error('Erro ao fazer parse do answerData:', e);
            }
          }
        });
      }
      return attemptWithAnswers;
    }

    return savedAttempt;
  }

  private async autoGradeAttempt(attempt: ExamAttempt): Promise<void> {
    // Buscar todas as respostas da tentativa
    const answers = await this.examAnswerRepository.find({
      where: { attempt: { id: attempt.id } },
      relations: ['question'],
    });

    let totalScore = 0;
    let totalPoints = 0;

    for (const answer of answers) {
      const question = answer.question;
      totalPoints += question.points;

      if (question.type === ExamQuestionType.MULTIPLE_CHOICE) {
        // Verificar se a resposta está correta
        const selectedOptionId = answer.answerData?.selected_option_id;
        const correctOptionId = question.correctAnswer?.option_id;

        if (selectedOptionId === correctOptionId) {
          answer.isCorrect = true;
          answer.pointsEarned = question.points;
          totalScore += question.points;
        } else {
          answer.isCorrect = false;
          answer.pointsEarned = 0;
        }

        await this.examAnswerRepository.save(answer);
      } else if (question.type === ExamQuestionType.ESSAY) {
        // Questões dissertativas não são corrigidas automaticamente
        answer.pointsEarned = 0;
        await this.examAnswerRepository.save(answer);
      }
    }

    // Calcular nota final (percentual)
    const maxScore = attempt.exam.activity.maxScore || totalPoints;
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    attempt.autoGradeScore = (percentage / 100) * maxScore;
    attempt.score = attempt.autoGradeScore;

    await this.examAttemptRepository.save(attempt);
  }

  private async createGradeFromAttempt(attempt: ExamAttempt): Promise<void> {
    // Verificar se há nota para criar
    if (attempt.score === null || attempt.score === undefined) {
      return; // Não criar nota se não houver score
    }

    // Verificar se student está carregado
    if (!attempt.student || !attempt.student.id) {
      return; // Não criar nota se não houver student
    }

    // Buscar enrollment do aluno na turma
    const exam = await this.examRepository.findOne({
      where: { id: attempt.exam.id },
      relations: ['activity', 'activity.class'],
    });

    if (!exam || !exam.activity || !exam.activity.class) {
      return; // Não criar nota se não houver exam, activity ou class
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        student: { id: attempt.student.id },
        class: { id: exam.activity.class.id },
      },
    });

    if (!enrollment) {
      return; // Não criar nota se não houver matrícula
    }

    // Verificar se já existe nota para esta atividade
    const existingGrade = await this.gradeRepository.findOne({
      where: {
        enrollment: { id: enrollment.id },
        activity: { id: exam.activity.id },
      },
    });

    if (existingGrade) {
      // Atualizar nota existente
      existingGrade.score = attempt.score;
      existingGrade.gradedAt = new Date();
      await this.gradeRepository.save(existingGrade);
    } else {
      // Criar nova nota
      const grade = this.gradeRepository.create({
        enrollment,
        activity: exam.activity,
        score: attempt.score,
        gradedAt: new Date(),
      });
      await this.gradeRepository.save(grade);
    }
  }

  // ========== CORREÇÃO MANUAL ==========

  async gradeAnswer(gradeAnswerDto: GradeExamAnswerDto, graderId: string): Promise<ExamAnswer> {
    const { answerId, pointsEarned, feedback } = gradeAnswerDto;

    const answer = await this.examAnswerRepository.findOne({
      where: { id: answerId },
      relations: ['question', 'attempt', 'attempt.exam'],
    });

    if (!answer) {
      throw new NotFoundException(`Resposta com ID '${answerId}' não encontrada.`);
    }

    // Verificar se a questão é dissertativa
    if (answer.question.type !== ExamQuestionType.ESSAY) {
      throw new BadRequestException('Apenas questões dissertativas podem ser corrigidas manualmente.');
    }

    // Verificar se a tentativa foi submetida
    if (answer.attempt.status === ExamAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Não é possível corrigir uma tentativa em andamento.');
    }

    answer.pointsEarned = pointsEarned || 0;
    answer.feedback = feedback || null;
    answer.gradedAt = new Date();

    const savedAnswer = await this.examAnswerRepository.save(answer);

    // Recalcular nota da tentativa
    await this.recalculateAttemptScore(answer.attempt.id, graderId);

    return savedAnswer;
  }

  private async recalculateAttemptScore(attemptId: string, graderId: string): Promise<void> {
    const attempt = await this.examAttemptRepository.findOne({
      where: { id: attemptId },
      relations: ['exam', 'exam.activity'],
    });

    if (!attempt) {
      throw new NotFoundException(`Tentativa com ID '${attemptId}' não encontrada.`);
    }

    const answers = await this.examAnswerRepository.find({
      where: { attempt: { id: attemptId } },
      relations: ['question'],
    });

    let totalScore = 0;
    let totalPoints = 0;

    for (const answer of answers) {
      totalPoints += answer.question.points;
      if (answer.pointsEarned !== null) {
        totalScore += answer.pointsEarned;
      }
    }

    const maxScore = attempt.exam.activity.maxScore || totalPoints;
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    attempt.manualGradeScore = (percentage / 100) * maxScore;
    attempt.score = attempt.manualGradeScore;
    attempt.gradedAt = new Date();
    // Buscar usuário que está corrigindo
    const grader = await this.userRepository.findOne({ where: { id: graderId } });
    if (grader) {
      attempt.gradedBy = grader;
    }
    attempt.status = ExamAttemptStatus.GRADED;

    await this.examAttemptRepository.save(attempt);

    // Atualizar nota (Grade)
    await this.createGradeFromAttempt(attempt);
  }

  // ========== CONSULTAS ==========

  async findAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
    const attempts = await this.examAttemptRepository.find({
      where: { exam: { id: examId } },
      relations: ['student', 'answers', 'answers.question'],
      order: { submittedAt: 'DESC' },
    });
    
    // Adicionar questionId em cada resposta
    attempts.forEach(attempt => {
      if (attempt.answers) {
        attempt.answers.forEach(answer => {
          if (answer.question) {
            (answer as any).questionId = answer.question.id;
          }
          // Garantir que answerData está como objeto
          if (answer.answerData && typeof answer.answerData === 'string') {
            try {
              answer.answerData = JSON.parse(answer.answerData);
            } catch (e) {
              console.error('Erro ao fazer parse do answerData:', e);
            }
          }
        });
      }
    });
    
    return attempts;
  }

  async findAttemptsByStudent(studentId: string): Promise<ExamAttempt[]> {
    const attempts = await this.examAttemptRepository.find({
      where: { student: { id: studentId } },
      relations: ['exam', 'exam.activity', 'answers', 'answers.question'],
      order: { submittedAt: 'DESC' },
    });
    
    // Adicionar examId e questionId explicitamente
    attempts.forEach(attempt => {
      // Garantir que examId está presente
      if (attempt.exam) {
        (attempt as any).examId = attempt.exam.id;
      }
      
      if (attempt.answers) {
        attempt.answers.forEach(answer => {
          if (answer.question) {
            (answer as any).questionId = answer.question.id;
          }
          // Garantir que answerData está como objeto
          if (answer.answerData && typeof answer.answerData === 'string') {
            try {
              answer.answerData = JSON.parse(answer.answerData);
            } catch (e) {
              console.error('Erro ao fazer parse do answerData:', e);
            }
          }
        });
      }
    });
    
    return attempts;
  }

  async findAttemptById(attemptId: string): Promise<ExamAttempt> {
    const attempt = await this.examAttemptRepository.findOne({
      where: { id: attemptId },
      relations: [
        'exam',
        'exam.activity',
        'exam.questions',
        'student',
        'answers',
        'answers.question',
      ],
    });

    if (!attempt) {
      throw new NotFoundException(`Tentativa com ID '${attemptId}' não encontrada.`);
    }

    // Garantir que answerData está como objeto (não string JSON) e adicionar questionId
    if (attempt.answers) {
      attempt.answers = attempt.answers.map((answer) => {
        // Garantir que answerData está como objeto
        if (answer.answerData && typeof answer.answerData === 'string') {
          try {
            answer.answerData = JSON.parse(answer.answerData);
          } catch (e) {
            // Se não conseguir fazer parse, manter como está
            console.error('Erro ao fazer parse do answerData:', e);
          }
        }
        
        // Garantir que questionId está presente (para facilitar o uso no frontend)
        if (answer.question) {
          (answer as any).questionId = answer.question.id;
        }
        
        return answer;
      });
    }

    return attempt;
  }
}

