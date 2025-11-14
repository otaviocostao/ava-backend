import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Class } from './entities/class.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discipline } from 'src/disciplines/entities/discipline.entity';
import { User } from 'src/users/entities/user.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';
import { Attendance } from 'src/attendances/entities/attendance.entity';
import { LessonPlan } from 'src/lesson-plans/entities/lesson-plan.entity';

@Injectable()
export class ClassesService {

  constructor (
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Discipline)
    private readonly disciplineRepository: Repository<Discipline>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(LessonPlan)
    private readonly lessonPlanRepository: Repository<LessonPlan>,
  ) {}

  // Criar nova Classe
  async create(createClassDto: CreateClassDto): Promise<Class> {
    const { disciplineId, teacherId, ...classData } = createClassDto;

    const discipline = await this.disciplineRepository.findOneBy({ id: disciplineId });
    if (!discipline) {
      throw new NotFoundException(`Disciplina com ID "${disciplineId}" não encontrada.`);
    }

    let teacher: User | null = null;
    if (teacherId) {
      teacher = await this.userRepository.findOneBy({ id: teacherId });
      if (!teacher) {
        throw new NotFoundException(`Usuário com ID "${teacherId}" não encontrado.`);
      }
    }

    const newClass = this.classRepository.create({
      ...classData,
      discipline,
      ...(teacher && { teacher }),
    });

    return this.classRepository.save(newClass);
  }

  // Buscar todas as Classes
  findAll() : Promise<Class[]> {
    return this.classRepository.find();
  }

  // Buscar Classe por id
  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['teacher', 'discipline'],
    });

    if (!classEntity){
      throw new NotFoundException(`Classe com o ID '${id}' não encontrada.`)
    }
    return classEntity;
  }

//Atualizar Classe
  async update(id: string, updateClassDto: UpdateClassDto): Promise<Class> {
    const { disciplineId, teacherId, ...classData } = updateClassDto;

    const classEntity = await this.classRepository.preload({
      id,
      ...classData,
    });

    if (!classEntity){
      throw new NotFoundException(`Classe com o ID '${id}' não encontrada.`)
    }

    if (disciplineId) {
      const discipline = await this.disciplineRepository.findOneBy({ id: disciplineId });
      if (!discipline) {
        throw new NotFoundException(`Disciplina com ID "${disciplineId}" não encontrada.`);
      }
      classEntity.discipline = discipline;
    }

    if (teacherId) {
      const teacher = await this.userRepository.findOneBy({ id: teacherId });
      if (!teacher) {
        throw new NotFoundException(`Usuário com ID "${teacherId}" não encontrado.`);
      }
      classEntity.teacher = teacher;
    }

    return await this.classRepository.save(classEntity);
  }

  async assignTeacher(classId: string, teacherId: string): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
      relations: ['teacher', 'discipline'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Classe com o ID '${classId}' não encontrada.`);
    }

    const teacher = await this.userRepository.findOneBy({ id: teacherId });
    if (!teacher) {
      throw new NotFoundException(`Usuário com ID "${teacherId}" não encontrado.`);
    }

    classEntity.teacher = teacher;
    await this.classRepository.save(classEntity);

    return this.classRepository.findOne({
      where: { id: classEntity.id },
      relations: ['teacher', 'discipline'],
    }) as Promise<Class>;
  }

  async findByTeacher(teacherId: string): Promise<Class[]> {
    return this.classRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['teacher', 'discipline'],
    });
  }

  // Buscar turmas do professor com dados completos (alunos, horários, aulas)
  async findByTeacherWithDetails(teacherId: string): Promise<any[]> {
    const classes = await this.classRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['teacher', 'discipline'],
    });

    const classesWithDetails = await Promise.all(
      classes.map(async (classEntity) => {
        // Buscar alunos (enrollments)
        const enrollments = await this.enrollmentRepository.find({
          where: { class: { id: classEntity.id } },
          relations: ['student', 'attendances'],
        });

        // Buscar horários
        const schedules = await this.scheduleRepository.find({
          where: { class: { id: classEntity.id } },
          order: { dayOfWeek: 'ASC', startTime: 'ASC' },
        });

        // Buscar aulas de lesson_plans (ao invés de gerar dinamicamente)
        const lessonPlans = await this.lessonPlanRepository
          .createQueryBuilder('lessonPlan')
          .leftJoinAndSelect('lessonPlan.schedule', 'schedule')
          .where('lessonPlan.class = :classId', { classId: classEntity.id })
          .orderBy('lessonPlan.date', 'ASC')
          .getMany();

        // Função para formatar horário (remove segundos se existirem)
        const formatTime = (time: string | null | undefined): string => {
          if (!time) return '08:00';
          // Se tiver segundos (HH:mm:ss), remover
          if (time.includes(':') && time.split(':').length === 3) {
            return time.substring(0, 5);
          }
          return time;
        };

        // Converter lesson_plans para formato de aulas
        const aulas = await Promise.all(
          lessonPlans.map(async (lessonPlan, index) => {
            // Buscar schedule se não estiver carregado
            let schedule: Schedule | null = lessonPlan.schedule;
            
            // Se não foi carregado pelo join, buscar manualmente usando query raw
            if (!schedule) {
              const result = await this.lessonPlanRepository
                .createQueryBuilder('lessonPlan')
                .select('lessonPlan.schedule_id', 'schedule_id')
                .where('lessonPlan.id = :id', { id: lessonPlan.id })
                .getRawOne();
              
              if (result?.schedule_id) {
                schedule = await this.scheduleRepository.findOne({
                  where: { id: result.schedule_id },
                });
              }
            }

            // Pegar horários e sala do schedule (já que lesson_plan não armazena mais esses dados)
            let startTime = schedule?.startTime ? formatTime(schedule.startTime) : '08:00';
            let endTime = schedule?.endTime ? formatTime(schedule.endTime) : '10:00';
            let room = schedule?.room || 'Não definida';
            
            // Buscar frequências para esta aula específica (por data)
            const alunosPresentes: string[] = [];
            enrollments.forEach(enrollment => {
              const attendance = enrollment.attendances?.find(att => att.date === lessonPlan.date);
              if (attendance && attendance.present) {
                alunosPresentes.push(enrollment.student.id);
              }
            });

            // Verificar se há frequência lançada para esta aula
            const hasAttendance = alunosPresentes.length > 0;

            let status: 'agendada' | 'lancada' | 'retificada' = 'agendada';
            if (lessonPlan.status === 'realizada') {
              status = hasAttendance ? 'lancada' : 'agendada';
            } else if (hasAttendance) {
              status = 'lancada';
            }

            return {
              id: lessonPlan.id,
              data: lessonPlan.date, // Manter como string para serialização JSON
              horario: `${startTime} - ${endTime}`,
              sala: room,
              status,
              alunosPresentes, // Adicionar lista de alunos presentes
              aulaIndex: index,
            };
          })
        );

        // Calcular estatísticas
        const totalAlunos = enrollments.length;
        const atividades = 0; // TODO: buscar do banco
        const avaliacoes = 0; // TODO: buscar do banco
        
        // Calcular média geral e frequência média
        let mediaGeral = 0;
        let frequenciaMedia = 0;
        
        if (enrollments.length > 0) {
          // TODO: calcular média geral das notas
          // TODO: calcular frequência média
          frequenciaMedia = 92; // placeholder
          mediaGeral = 7.8; // placeholder
        }

        // Próxima aula
        const proximaAula = this.getProximaAula(schedules);

        return {
          id: classEntity.id,
          nome: classEntity.code,
          disciplina: classEntity.discipline.name,
          alunos: totalAlunos,
          mediaGeral,
          frequenciaMedia,
          proximaAula,
          sala: schedules[0]?.room || 'Não definida',
          atividades,
          avaliacoes,
          listaAlunos: enrollments.map((enrollment) => ({
            id: enrollment.student.id,
            nome: enrollment.student.name,
            matricula: enrollment.student.email, // Usando email como matrícula temporariamente
            enrollmentId: enrollment.id, // ID da matrícula para usar nas frequências
          })),
          aulas,
        };
      })
    );

    return classesWithDetails;
  }

  private getProximaAula(schedules: Schedule[]): string {
    if (schedules.length === 0) return 'Não agendada';

    const today = new Date();
    const currentDay = today.getDay();
    
    const dayOfWeekMap: Record<string, number> = {
      'domingo': 0,
      'segunda-feira': 1,
      'terca-feira': 2,
      'quarta-feira': 3,
      'quinta-feira': 4,
      'sexta-feira': 5,
      'sabado': 6,
    };

    const dayNames: Record<number, string> = {
      0: 'Domingo',
      1: 'Segunda',
      2: 'Terça',
      3: 'Quarta',
      4: 'Quinta',
      5: 'Sexta',
      6: 'Sábado',
    };

    // Encontrar o próximo horário
    for (const schedule of schedules) {
      const scheduleDay = dayOfWeekMap[schedule.dayOfWeek];
      const daysUntil = scheduleDay >= currentDay 
        ? scheduleDay - currentDay 
        : 7 - currentDay + scheduleDay;
      
      if (daysUntil <= 7) {
        return `${dayNames[scheduleDay]}, ${schedule.startTime} - ${schedule.endTime}`;
      }
    }

    return `${dayNames[dayOfWeekMap[schedules[0].dayOfWeek]]}, ${schedules[0].startTime} - ${schedules[0].endTime}`;
  }

  // Excluir Classe
  async remove(id: string): Promise<void> {
    const result = await this.classRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Classe com o ID '${id}' não encontrada.`);
    }
  }
}
