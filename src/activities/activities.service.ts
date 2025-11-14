import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivitySubmission } from './entities/activity-submission.entity';
import { Class } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { ActivitySubmissionStatus } from '../common/enums/activity-submission-status.enum';
import { StorageService } from '../storage/storage.service';
import { nanoid } from 'nanoid';
import { MulterFile } from 'src/common/types/multer.types';
import { ActivityUnit } from '../common/enums/activity-unit.enum';
import { StudentActivityDto } from './dto/student-activity.dto';
import { Grade } from 'src/grades/entities/grade.entity';

@Injectable()
export class ActivitiesService {
  private readonly activityRelations = ['class', 'class.discipline', 'class.teacher'];

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(ActivitySubmission)
    private readonly activitySubmissionRepository: Repository<ActivitySubmission>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Normaliza o valor da unidade para o formato padrão do enum.
   * Aceita valores como "unidade 1", "unidade 2", "prova final" e converte para os valores do enum.
   * Também aceita valores já no formato correto do enum.
   */
  private normalizeUnit(unit: string | ActivityUnit): ActivityUnit {
    // Se já for um valor válido do enum, retorna como está
    if (Object.values(ActivityUnit).includes(unit as ActivityUnit)) {
      return unit as ActivityUnit;
    }

    const normalizedUnit = String(unit).trim().toLowerCase();

    if (normalizedUnit === 'unidade 1' || normalizedUnit === '1ª unidade') {
      return ActivityUnit.FIRST_UNIT;
    }

    if (normalizedUnit === 'unidade 2' || normalizedUnit === '2ª unidade') {
      return ActivityUnit.SECOND_UNIT;
    }

    if (normalizedUnit === 'prova final') {
      return ActivityUnit.FINAL_EXAM;
    }

    // Se não corresponder a nenhum formato conhecido, lança erro
    throw new BadRequestException(
      `Unidade inválida: "${unit}". Valores aceitos: ${Object.values(ActivityUnit).join(', ')}`,
    );
  }

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const { classId, unit, ...rest } = createActivityDto;

    const classEntity = await this.findClassOrThrowException(classId);

    // Normaliza o valor da unidade antes de salvar
    const normalizedUnit = this.normalizeUnit(unit);

    const activity = this.activityRepository.create({
      ...rest,
      unit: normalizedUnit,
      class: classEntity,
    });

    return this.activityRepository.save(activity);
  }

  async findAll(): Promise<Activity[]> {
    return this.activityRepository.find({
      relations: this.activityRelations,
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: this.activityRelations,
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
    return activity;
  }

  /**
   * Retorna apenas os anexos (URLs) de uma atividade
   */
  async getActivityAttachments(activityId: string): Promise<{ attachmentUrls: string[] }> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      select: ['id', 'attachmentUrls'],
    });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    return {
      attachmentUrls: activity.attachmentUrls || [],
    };
  }

  /**
   * Faz download de um anexo específico de uma atividade
   */
  async downloadActivityAttachment(
    activityId: string,
    attachmentUrl: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      select: ['id', 'attachmentUrls'],
    });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    // Verifica se o anexo existe na lista de anexos da atividade
    const attachmentUrls = activity.attachmentUrls || [];
    if (!attachmentUrls.includes(attachmentUrl)) {
      throw new NotFoundException('Anexo nao encontrado nesta atividade.');
    }

    // Extrai o path do arquivo da URL
    const filePath = this.storageService.extractPathFromUrl(attachmentUrl);
    if (!filePath) {
      throw new BadRequestException('URL do anexo invalida.');
    }

    // Faz download do arquivo
    return this.storageService.downloadFile(filePath);
  }

  /**
   * Retorna os anexos de uma atividade para um aluno (com validação de permissão)
   */
  async getActivityAttachmentsForStudent(
    activityId: string,
    studentId: string,
  ): Promise<{ attachmentUrls: string[] }> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({
        where: { id: activityId },
        relations: ['class'],
        select: ['id', 'attachmentUrls'],
      }),
      this.userRepository.findOne({
        where: { id: studentId },
        relations: ['roles'],
      }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    // Valida se é um aluno
    const isStudentRole = student.roles.some((role) => role.name === 'student');
    if (!isStudentRole) {
      throw new ForbiddenException('Apenas alunos podem acessar este endpoint.');
    }

    // Valida se o aluno está matriculado na turma
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        class: { id: activity.class.id },
        student: { id: studentId },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Voce nao esta matriculado na turma desta atividade.');
    }

    return {
      attachmentUrls: activity.attachmentUrls || [],
    };
  }

  /**
   * Faz download de um anexo específico de uma atividade para um aluno (com validação de permissão)
   */
  async downloadActivityAttachmentForStudent(
    activityId: string,
    studentId: string,
    attachmentUrl: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({
        where: { id: activityId },
        relations: ['class'],
        select: ['id', 'attachmentUrls'],
      }),
      this.userRepository.findOne({
        where: { id: studentId },
        relations: ['roles'],
      }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    // Valida se é um aluno
    const isStudentRole = student.roles.some((role) => role.name === 'student');
    if (!isStudentRole) {
      throw new ForbiddenException('Apenas alunos podem fazer download de anexos.');
    }

    // Valida se o aluno está matriculado na turma
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        class: { id: activity.class.id },
        student: { id: studentId },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Voce nao esta matriculado na turma desta atividade.');
    }

    // Verifica se o anexo existe na lista de anexos da atividade
    const attachmentUrls = activity.attachmentUrls || [];
    if (!attachmentUrls.includes(attachmentUrl)) {
      throw new NotFoundException('Anexo nao encontrado nesta atividade.');
    }

    // Extrai o path do arquivo da URL
    const filePath = this.storageService.extractPathFromUrl(attachmentUrl);
    if (!filePath) {
      throw new BadRequestException('URL do anexo invalida.');
    }

    // Faz download do arquivo
    return this.storageService.downloadFile(filePath);
  }

  async update(id: string, updateActivityDto: UpdateActivityDto): Promise<Activity> {
    const { classId, unit, ...rest } = updateActivityDto;

    const preloadData: Partial<Activity> = {
      id,
      ...rest,
    };

    // Normaliza o valor da unidade se fornecido
    if (unit !== undefined) {
      preloadData.unit = this.normalizeUnit(unit);
    }

    if (classId !== undefined) {
      const classEntity = await this.findClassOrThrowException(classId);
      preloadData.class = classEntity;
    }

    const activity = await this.activityRepository.preload(preloadData);
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
    return this.activityRepository.save(activity);
  }

  async remove(id: string): Promise<void> {
    const activity = await this.findOne(id);
    await this.activityRepository.remove(activity);
  }

  async findByClassId(classId: string): Promise<Activity[]> {
    await this.findClassOrThrowException(classId);

    return this.activityRepository.find({
      where: { class: { id: classId } },
      relations: this.activityRelations,
      order: { dueDate: 'ASC' },
    });
  }

  async findActivitiesByStudent(studentId: string): Promise<StudentActivityDto[]> {
    const student = await this.userRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" não encontrado.`);
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class'],
    });

    if (enrollments.length === 0) {
      return [];
    }

    const classIds = enrollments.map(e => e.class.id);
    const activities = await this.activityRepository.find({
      where: { class: { id: In(classIds) } },
      relations: ['class.discipline'], 
      order: { dueDate: 'ASC' },
    });

    const submissions = await this.activitySubmissionRepository.find({
        where: {
            student: { id: studentId },
            activity: { id: In(activities.map(a => a.id)) },
        },
        relations: ['activity'],
    });

    const submissionsMap = new Map<string, ActivitySubmission>();
    submissions.forEach(sub => submissionsMap.set(sub.activity.id, sub));
    
    const grades = await this.gradeRepository.find({
        where: {
            enrollment: { id: In(enrollments.map(e => e.id)) },
            activity: { id: In(activities.map(a => a.id)) },
        },
        relations: ['activity'],
    });
    
    const gradesMap = new Map<string, Grade>();
    grades.forEach(grade => gradesMap.set(grade.activity.id, grade));
    
    const studentActivities = activities.map(activity => {
      const submission = submissionsMap.get(activity.id);

      const grade = gradesMap.get(activity.id);
      
      let status: 'pendente' | 'concluido' | 'avaliado';
      let nota: number | null = null;
      let dataConclusao: string | null = null;
      
      if (submission) {
        switch (submission.status) {
          case ActivitySubmissionStatus.SUBMITTED:
            status = 'concluido'; 
            break;
          case ActivitySubmissionStatus.COMPLETED: 
            status = 'avaliado';
            nota = submission.grade ?? null;
            break;
          default:
            status = 'pendente';
        }
        dataConclusao = submission.submittedAt
          ? new Date(submission.submittedAt).toLocaleDateString('pt-BR')
          : null;
      } else {
        status = 'pendente';
      }
      
      return {
        id: activity.id,
        titulo: activity.title,
        descricao: activity.description,
        dataVencimento: activity.dueDate,
        disciplina: activity.class.discipline.name,
        status,
        nota,
        dataConclusao,
      };
    });

    return studentActivities;
  }

  async findByStudentId(studentId: string): Promise<Activity[]> {
    const student = await this.userRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class'],
    });

    const classIds = enrollments.map((e) => e.class.id);
    if (classIds.length === 0) {
      return [];
    }

    return this.activityRepository.find({
      where: { class: { id: In(classIds) } },
      relations: this.activityRelations,
      order: { dueDate: 'ASC' },
    });
  }

  async findAllWithFilters(query: {
    studentId?: string;
    classId?: string;
    status?: ActivitySubmissionStatus;
  }): Promise<Activity[]> {
    if (query.studentId) {
      return this.findByStudentId(query.studentId);
    }

    if (query.classId) {
      return this.findByClassId(query.classId);
    }

    return this.findAll();
  }

  async completeActivity(activityId: string, studentId: string): Promise<ActivitySubmission> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({ where: { id: activityId } }),
      this.userRepository.findOne({ where: { id: studentId } }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    const existingSubmission = await this.activitySubmissionRepository.findOne({
      where: { activity: { id: activityId }, student: { id: studentId } },
    });

    if (existingSubmission) {
      existingSubmission.status = ActivitySubmissionStatus.COMPLETED;
      existingSubmission.submittedAt = new Date();
      return this.activitySubmissionRepository.save(existingSubmission);
    }

    const submission = this.activitySubmissionRepository.create({
      activity,
      student,
      status: ActivitySubmissionStatus.COMPLETED,
      submittedAt: new Date(),
    });

    return this.activitySubmissionRepository.save(submission);
  }

  async submitActivity(
    activityId: string,
    studentId: string,
    fileUrls?: string[],
  ): Promise<ActivitySubmission> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({ where: { id: activityId } }),
      this.userRepository.findOne({ where: { id: studentId } }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    const existingSubmission = await this.activitySubmissionRepository.findOne({
      where: { activity: { id: activityId }, student: { id: studentId } },
    });

    if (existingSubmission) {
      existingSubmission.status = ActivitySubmissionStatus.SUBMITTED;
      existingSubmission.fileUrls = fileUrls || existingSubmission.fileUrls;
      existingSubmission.submittedAt = new Date();
      return this.activitySubmissionRepository.save(existingSubmission);
    }

    const submission = this.activitySubmissionRepository.create({
      activity,
      student,
      status: ActivitySubmissionStatus.SUBMITTED,
      fileUrls: fileUrls || null,
      submittedAt: new Date(),
    });

    return this.activitySubmissionRepository.save(submission);
  }

  async findSubmissionsByActivityId(activityId: string): Promise<ActivitySubmission[]> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    const submissions = await this.activitySubmissionRepository.find({
      where: { activity: { id: activityId } },
      relations: ['student', 'activity', 'activity.class'],
    });

    // Ordena manualmente para lidar com valores null
    return submissions.sort((a, b) => {
      if (!a.submittedAt && !b.submittedAt) return 0;
      if (!a.submittedAt) return 1;
      if (!b.submittedAt) return -1;
      return b.submittedAt.getTime() - a.submittedAt.getTime();
    });
  }

  /**
   * Retorna todos os arquivos de todas as submissões de uma atividade
   * Organizados por aluno para facilitar o download
   */
  async getAllSubmissionFiles(activityId: string): Promise<{
    activityId: string;
    totalFiles: number;
    submissions: Array<{
      submissionId: string;
      studentId: string;
      studentName: string;
      fileUrls: string[];
      fileCount: number;
      submittedAt: Date | null;
    }>;
  }> {
    const activity = await this.activityRepository.findOne({ where: { id: activityId } });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    const submissions = await this.activitySubmissionRepository.find({
      where: { activity: { id: activityId } },
      relations: ['student'],
      select: ['id', 'fileUrls', 'submittedAt', 'student'],
    });

    let totalFiles = 0;
    const submissionsData = submissions.map((submission) => {
      const fileUrls = this.normalizeFileUrls(submission.fileUrls);

      // Cria array com informações detalhadas de cada arquivo
      const files = fileUrls.map((url) => {
        const path = this.storageService.extractPathFromUrl(url);
        const fileName = path ? path.split('/').pop() || 'arquivo' : 'arquivo';
        const originalName = this.storageService.extractOriginalFileName(fileName);

        return {
          url,
          originalName,
          fileName,
        };
      });

      totalFiles += fileUrls.length;

      return {
        submissionId: submission.id,
        studentId: submission.student.id,
        studentName: submission.student.name,
        fileUrls, // Mantém para compatibilidade
        files, // Nova propriedade com informações detalhadas
        fileCount: fileUrls.length,
        submittedAt: submission.submittedAt,
      };
    });

    return {
      activityId,
      totalFiles,
      submissions: submissionsData,
    };
  }

  async findSubmissionByActivityAndStudent(
    activityId: string,
    studentId: string,
  ): Promise<ActivitySubmission> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({ where: { id: activityId } }),
      this.userRepository.findOne({ where: { id: studentId } }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    const submission = await this.activitySubmissionRepository.findOne({
      where: { activity: { id: activityId }, student: { id: studentId } },
      relations: ['student', 'activity', 'activity.class'],
    });

    if (!submission) {
      throw new NotFoundException(
        `Submissao nao encontrada para a atividade "${activityId}" e estudante "${studentId}".`,
      );
    }

    return submission;
  }

  async findSubmissionsByStudentId(studentId: string): Promise<ActivitySubmission[]> {
    const student = await this.userRepository.findOne({ where: { id: studentId } });

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    return this.activitySubmissionRepository.find({
      where: { student: { id: studentId } },
      relations: ['activity', 'activity.class'],
      order: { submittedAt: 'DESC' },
    });
  }

  async findSubmissionById(submissionId: string): Promise<ActivitySubmission> {
    const submission = await this.activitySubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['student', 'activity', 'activity.class'],
    });

    if (!submission) {
      throw new NotFoundException(`Submissao com ID "${submissionId}" nao encontrada.`);
    }

    return submission;
  }

  /**
   * Retorna apenas os arquivos (URLs) de uma submissão específica
   */
  async getSubmissionFiles(submissionId: string): Promise<{ fileUrls: string[] }> {
    const submission = await this.activitySubmissionRepository.findOne({
      where: { id: submissionId },
      select: ['id', 'fileUrls'],
    });

    if (!submission) {
      throw new NotFoundException(`Submissao com ID "${submissionId}" nao encontrada.`);
    }

    return {
      fileUrls: this.normalizeFileUrls(submission.fileUrls),
    };
  }

  /**
   * Retorna informações detalhadas dos arquivos de uma submissão
   * Inclui nome original, URL e outras informações úteis para o frontend
   */
  async getSubmissionFilesDetailed(submissionId: string): Promise<{
    files: Array<{
      url: string;
      originalName: string;
      fileName: string;
    }>;
  }> {
    const submission = await this.activitySubmissionRepository.findOne({
      where: { id: submissionId },
      select: ['id', 'fileUrls'],
    });

    if (!submission) {
      throw new NotFoundException(`Submissao com ID "${submissionId}" nao encontrada.`);
    }

    const fileUrls = this.normalizeFileUrls(submission.fileUrls);

    const files = fileUrls.map((url) => {
      const path = this.storageService.extractPathFromUrl(url);
      const fileName = path ? path.split('/').pop() || 'arquivo' : 'arquivo';
      const originalName = this.storageService.extractOriginalFileName(fileName);

      return {
        url,
        originalName,
        fileName,
      };
    });

    return { files };
  }

  /**
   * Normaliza fileUrls para sempre retornar um array
   * Trata casos onde o campo pode estar salvo como string JSON ao invés de array JSONB
   * Nota: O transformer na entidade já faz isso automaticamente, mas mantemos esta função
   * como fallback para casos onde o transformer não foi aplicado ainda
   */
  private normalizeFileUrls(fileUrls: any): string[] {
    if (!fileUrls) {
      return [];
    }

    // Se já é um array, retorna diretamente
    if (Array.isArray(fileUrls)) {
      return fileUrls;
    }

    // Se é uma string, tenta fazer parse do JSON
    if (typeof fileUrls === 'string') {
      try {
        const parsed = JSON.parse(fileUrls);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Se não conseguir fazer parse, retorna array vazio
        return [];
      }
    }

    return [];
  }

  /**
   * Faz download de um arquivo específico de uma submissão
   */
  async downloadSubmissionFile(
    submissionId: string,
    fileUrl: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    // Decodifica a URL caso esteja codificada
    const decodedFileUrl = decodeURIComponent(fileUrl);

    const submission = await this.activitySubmissionRepository.findOne({
      where: { id: submissionId },
      select: ['id', 'fileUrls'],
    });

    if (!submission) {
      throw new NotFoundException(`Submissao com ID "${submissionId}" nao encontrada.`);
    }

    // Normaliza fileUrls para garantir que seja um array
    const fileUrls = this.normalizeFileUrls(submission.fileUrls);

    // Debug: log para verificar o que está sendo retornado
    console.log('[DEBUG] submission.fileUrls raw:', submission.fileUrls);
    console.log('[DEBUG] submission.fileUrls type:', typeof submission.fileUrls);
    console.log('[DEBUG] fileUrls normalized:', fileUrls);
    console.log('[DEBUG] fileUrl recebido:', fileUrl);
    console.log('[DEBUG] decodedFileUrl:', decodedFileUrl);

    // Verifica tanto a URL codificada quanto a decodificada
    const urlMatches = fileUrls.includes(fileUrl) || fileUrls.includes(decodedFileUrl);
    
    if (!urlMatches) {
      throw new NotFoundException(
        `Arquivo nao encontrado na submissao "${submissionId}". URLs disponiveis: ${fileUrls.join(', ')}`,
      );
    }

    // Usa a URL decodificada para extrair o path
    const urlToUse = fileUrls.includes(decodedFileUrl) ? decodedFileUrl : fileUrl;
    
    console.log('[DEBUG] urlToUse:', urlToUse);
    
    // Extrai o caminho do arquivo da URL
    const filePath = this.storageService.extractPathFromUrl(urlToUse);
    console.log('[DEBUG] filePath extraido:', filePath);
    
    if (!filePath) {
      throw new BadRequestException(`URL do arquivo invalida: ${urlToUse}`);
    }

    return this.storageService.downloadFile(filePath);
  }


  private async findClassOrThrowException(classId: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new NotFoundException(`Turma com ID "${classId}" nao encontrada.`);
    }

    return classEntity;
  }

  /**
   * Faz upload de múltiplos anexos do professor para uma atividade
   */
  async uploadActivityAttachments(
    activityId: string,
    teacherId: string,
    files: MulterFile[],
  ): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['class', 'class.teacher'],
    });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    // Valida se o professor tem acesso à turma (é o professor da turma)
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['roles'],
    });

    if (!teacher) {
      throw new NotFoundException(`Professor com ID "${teacherId}" nao encontrado.`);
    }

    const isTeacherRole = teacher.roles.some((role) => role.name === 'teacher');
    if (!isTeacherRole) {
      throw new ForbiddenException('Apenas professores podem fazer upload de anexos.');
    }

    // Valida se o professor é o dono da turma ou tem acesso
    if (activity.class.teacher?.id !== teacherId) {
      // Verifica se o professor está matriculado na turma (caso de professor aluno)
      const enrollment = await this.enrollmentRepository.findOne({
        where: {
          class: { id: activity.class.id },
          student: { id: teacherId },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'Voce nao tem permissao para fazer upload de anexos nesta atividade.',
        );
      }
    }

    // Faz upload de todos os arquivos
    const currentAttachments = activity.attachmentUrls || [];
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Sanitiza o nome do arquivo removendo caracteres especiais
      const sanitizedOriginalName = file.originalname
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por underscore
        .replace(/_{2,}/g, '_'); // Remove underscores duplicados
      
      const fileName = `${Date.now()}-${nanoid()}-${sanitizedOriginalName}`;
      const storagePath = `${activity.class.id}/${activityId}/${teacherId}/${fileName}`;

      const fileUrl = await this.storageService.uploadFile(
        file.buffer,
        storagePath,
        file.mimetype,
      );

      uploadedUrls.push(fileUrl);
    }

    // Atualiza a lista de anexos da atividade
    activity.attachmentUrls = [...currentAttachments, ...uploadedUrls];

    return this.activityRepository.save(activity);
  }

  /**
   * Faz upload de um anexo do professor para uma atividade
   */
  async uploadActivityAttachment(
    activityId: string,
    teacherId: string,
    file: MulterFile,
  ): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['class', 'class.teacher'],
    });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    // Valida se o professor tem acesso à turma (é o professor da turma)
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['roles'],
    });

    if (!teacher) {
      throw new NotFoundException(`Professor com ID "${teacherId}" nao encontrado.`);
    }

    const isTeacherRole = teacher.roles.some((role) => role.name === 'teacher');
    if (!isTeacherRole) {
      throw new ForbiddenException('Apenas professores podem fazer upload de anexos.');
    }

    // Valida se o professor é o dono da turma ou tem acesso
    if (activity.class.teacher?.id !== teacherId) {
      // Verifica se o professor está matriculado na turma (caso de professor aluno)
      const enrollment = await this.enrollmentRepository.findOne({
        where: {
          class: { id: activity.class.id },
          student: { id: teacherId },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'Voce nao tem permissao para fazer upload de anexos nesta atividade.',
        );
      }
    }

    // Gera nome único para o arquivo
    // Sanitiza o nome do arquivo removendo caracteres especiais
    const sanitizedOriginalName = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por underscore
      .replace(/_{2,}/g, '_'); // Remove underscores duplicados
    
    const fileName = `${Date.now()}-${nanoid()}-${sanitizedOriginalName}`;
    const storagePath = `${activity.class.id}/${activityId}/${teacherId}/${fileName}`;

    // Faz upload para o Supabase Storage
    const fileUrl = await this.storageService.uploadFile(
      file.buffer,
      storagePath,
      file.mimetype,
    );

    // Atualiza a lista de anexos da atividade
    const currentAttachments = activity.attachmentUrls || [];
    activity.attachmentUrls = [...currentAttachments, fileUrl];

    return this.activityRepository.save(activity);
  }

  /**
   * Remove um anexo do professor de uma atividade
   */
  async removeActivityAttachment(
    activityId: string,
    teacherId: string,
    attachmentUrl: string,
  ): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['class'],
    });

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    // Busca a classe diretamente para garantir que temos o teacher_id
    // Usa select para garantir que temos o teacher_id mesmo se a relação não carregar
    const classEntity = await this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.teacher', 'teacher')
      .where('class.id = :classId', { classId: activity.class.id })
      .getOne();

    if (!classEntity) {
      throw new NotFoundException(`Turma com ID "${activity.class.id}" nao encontrada.`);
    }

    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      relations: ['roles'],
    });

    if (!teacher) {
      throw new NotFoundException(`Professor com ID "${teacherId}" nao encontrado.`);
    }

    const isTeacherRole = teacher.roles.some((role) => role.name === 'teacher');
    const isAdminRole = teacher.roles.some((role) => role.name === 'admin');
    
    if (!isTeacherRole && !isAdminRole) {
      throw new ForbiddenException('Apenas professores ou administradores podem remover anexos.');
    }

    // Valida permissão: apenas o professor da turma ou admin pode remover anexos
    // Tenta obter o teacher_id da relação ou diretamente da classe
    const classTeacherId = classEntity.teacher?.id || (classEntity as any).teacher_id;
    const isClassTeacher = classTeacherId === teacherId;
    
    if (!isClassTeacher && !isAdminRole) {
      throw new ForbiddenException(
        'Voce nao tem permissao para remover anexos desta atividade.',
      );
    }

    // Verifica se o anexo existe na lista
    const currentAttachments = activity.attachmentUrls || [];
    if (!currentAttachments.includes(attachmentUrl)) {
      throw new NotFoundException('Anexo nao encontrado nesta atividade.');
    }

    // Remove do storage
    const filePath = this.storageService.extractPathFromUrl(attachmentUrl);
    if (filePath) {
      await this.storageService.deleteFile(filePath);
    }

    // Remove da lista de anexos
    activity.attachmentUrls = currentAttachments.filter((url) => url !== attachmentUrl);

    return this.activityRepository.save(activity);
  }

  /**
   * Faz upload de múltiplas submissões de atividade do aluno
   * Sempre marca como concluída quando há upload de arquivos
   */
  async uploadActivitySubmissions(
    activityId: string,
    studentId: string,
    files: MulterFile[],
    comment?: string,
  ): Promise<ActivitySubmission> {
    const [activity, student] = await Promise.all([
      this.activityRepository.findOne({
        where: { id: activityId },
        relations: ['class'],
      }),
      this.userRepository.findOne({
        where: { id: studentId },
        relations: ['roles'],
      }),
    ]);

    if (!activity) {
      throw new NotFoundException(`Atividade com ID "${activityId}" nao encontrada.`);
    }

    if (!student) {
      throw new NotFoundException(`Estudante com ID "${studentId}" nao encontrado.`);
    }

    // Valida se é um aluno
    const isStudentRole = student.roles.some((role) => role.name === 'student');
    if (!isStudentRole) {
      throw new ForbiddenException('Apenas alunos podem fazer upload de submissoes.');
    }

    // Valida se o aluno está matriculado na turma
    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        class: { id: activity.class.id },
        student: { id: studentId },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'Voce nao esta matriculado na turma desta atividade.',
      );
    }

    // Faz upload de todos os arquivos
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Sanitiza o nome do arquivo removendo caracteres especiais
      const sanitizedOriginalName = file.originalname
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por underscore
        .replace(/_{2,}/g, '_'); // Remove underscores duplicados
      
      const fileName = `${Date.now()}-${nanoid()}-${sanitizedOriginalName}`;
      const storagePath = `${activity.class.id}/${activityId}/${studentId}/${fileName}`;

      const fileUrl = await this.storageService.uploadFile(
        file.buffer,
        storagePath,
        file.mimetype,
      );

      uploadedUrls.push(fileUrl);
    }

    // Busca ou cria submissão
    let submission = await this.activitySubmissionRepository.findOne({
      where: {
        activity: { id: activityId },
        student: { id: studentId },
      },
    });

    if (submission) {
      // Se já existe, remove os arquivos antigos se houver
      const oldFileUrls = this.normalizeFileUrls(submission.fileUrls);

      for (const oldUrl of oldFileUrls) {
        const oldFilePath = this.storageService.extractPathFromUrl(oldUrl);
        if (oldFilePath) {
          await this.storageService.deleteFile(oldFilePath).catch(() => {
            // Ignora erros ao remover arquivo antigo
          });
        }
      }

      // Atualiza com os novos arquivos
      submission.fileUrls = uploadedUrls;
      submission.status = ActivitySubmissionStatus.COMPLETED;
      submission.submittedAt = new Date();
      if (typeof comment === 'string') {
        submission.comment = comment;
      }
    } else {
      submission = this.activitySubmissionRepository.create({
        activity,
        student,
        fileUrls: uploadedUrls,
        status: ActivitySubmissionStatus.COMPLETED,
        submittedAt: new Date(),
        comment: typeof comment === 'string' ? comment : null,
      });
    }

    return this.activitySubmissionRepository.save(submission);
  }

  /**
   * Faz upload de uma submissão de atividade do aluno (método legado - mantido para compatibilidade)
   * Sempre marca como concluída quando há upload de arquivo
   */
  async uploadActivitySubmission(
    activityId: string,
    studentId: string,
    file: MulterFile,
    comment?: string,
  ): Promise<ActivitySubmission> {
    return this.uploadActivitySubmissions(activityId, studentId, [file], comment);
  }

  /**
   * Remove um arquivo específico de uma submissão
   * Se for o último arquivo, reseta a submissão para PENDING
   */
  async removeSubmissionFile(
    submissionId: string,
    fileUrl: string,
    studentId: string,
  ): Promise<ActivitySubmission> {
    // Decodifica a URL caso esteja codificada
    const decodedFileUrl = decodeURIComponent(fileUrl);

    const submission = await this.activitySubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['activity', 'student'],
    });

    if (!submission) {
      throw new NotFoundException(`Submissao com ID "${submissionId}" nao encontrada.`);
    }

    // Valida se o aluno é o dono da submissão
    if (submission.student.id !== studentId) {
      throw new ForbiddenException('Voce nao tem permissao para remover arquivos desta submissao.');
    }

    // Normaliza fileUrls
    const fileUrls = this.normalizeFileUrls(submission.fileUrls);

    // Verifica se o arquivo pertence à submissão
    const fileIndex = fileUrls.findIndex(
      (url) => url === fileUrl || url === decodedFileUrl,
    );

    if (fileIndex === -1) {
      throw new NotFoundException(
        `Arquivo nao encontrado na submissao "${submissionId}".`,
      );
    }

    // Remove o arquivo do storage
    const urlToRemove = fileUrls[fileIndex];
    const filePath = this.storageService.extractPathFromUrl(urlToRemove);
    if (filePath) {
      await this.storageService.deleteFile(filePath).catch(() => {
        // Ignora erros ao remover arquivo do storage
      });
    }

    // Remove a URL do array
    fileUrls.splice(fileIndex, 1);

    // Atualiza a submissão
    if (fileUrls.length === 0) {
      // Se não sobrou nenhum arquivo, reseta para PENDING
      submission.fileUrls = null;
      submission.status = ActivitySubmissionStatus.PENDING;
      submission.submittedAt = null;
    } else {
      // Se ainda há arquivos, mantém como COMPLETED
      submission.fileUrls = fileUrls;
    }

    return this.activitySubmissionRepository.save(submission);
  }

  /**
   * Remove a submissão de um aluno
   */
  async removeActivitySubmission(
    activityId: string,
    studentId: string,
  ): Promise<void> {
    const submission = await this.activitySubmissionRepository.findOne({
      where: {
        activity: { id: activityId },
        student: { id: studentId },
      },
      relations: ['activity', 'activity.class', 'student'],
    });

    if (!submission) {
      throw new NotFoundException('Submissao nao encontrada.');
    }

    // Valida se o aluno é o dono da submissão
    if (submission.student.id !== studentId) {
      throw new ForbiddenException('Voce nao tem permissao para remover esta submissao.');
    }

    // Remove arquivos do storage se existirem
    const fileUrlsToRemove = this.normalizeFileUrls(submission.fileUrls);

    for (const fileUrl of fileUrlsToRemove) {
      const filePath = this.storageService.extractPathFromUrl(fileUrl);
      if (filePath) {
        await this.storageService.deleteFile(filePath).catch(() => {
          // Ignora erros ao remover arquivo
        });
      }
    }

    // Remove a submissão ou reseta para PENDING
    submission.fileUrls = null;
    submission.status = ActivitySubmissionStatus.PENDING;
    submission.submittedAt = null;

    await this.activitySubmissionRepository.save(submission);
  }
}
