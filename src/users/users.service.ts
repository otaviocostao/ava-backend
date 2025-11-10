import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/roles/entities/role.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { GradebookEntryDto } from './dto/gradebook-entry.dto';
import { Attendance } from 'src/attendances/entities/attendance.entity';
import { DetailedGradebookDto } from './dto/detailed-gradebook.dto';
import { Class } from 'src/classes/entities/class.entity';
import { AttendanceData, DetailedAbsence } from './dto/frequency-user.dto';


@Injectable()
export class UsersService {

  constructor (
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('O e-mail informado já está em uso.');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: passwordHash,
    });
    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com o ID '${id}' não encontrado.`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`Usuário com o ID '${id}' não encontrado.`);
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Usuário com o ID '${id}' não encontrado.`);
    }
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.email = :email', { email })
      .getOne();
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<User> {
    
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'], 
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }

    const role = await this.roleRepository.findOneBy({ id: roleId });
    if (!role) {
      throw new NotFoundException(`Papel com ID "${roleId}" não encontrado.`);
    }

    const userHasRole = user.roles.some((r) => r.id === role.id);
    if (userHasRole) {
      throw new ConflictException('O usuário já possui este papel.');
    }

    user.roles.push(role);
    return this.userRepository.save(user);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID "${userId}" não encontrado.`);
    }

    user.roles = user.roles.filter((role) => role.id !== roleId);

    return this.userRepository.save(user);
  }

  async getStudentGradebook(studentId: string): Promise<DetailedGradebookDto> {
    const student = await this.userRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Aluno com ID "${studentId}" não encontrado.`);
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: [
        'class',
        'class.discipline',
        'grades',
        'grades.activity',
      ],
    });

    if (!enrollments.length) {
      return { geral: { mediaGeral: 0, frequenciaGeral: 0, disciplinasAprovadas: 0, totalDisciplinas: 0 }, disciplinas: [] };
    }

    const disciplinasPromises = enrollments.map(async (enrollment) => {

      const notasPorUnidade = new Map<string, number>();

      enrollment.grades.forEach(grade => {
        if (!grade.activity || !grade.activity.unit) {
          return;
        }

        const unidadeOriginal = grade.activity.unit;
        let unidadeFormatada = grade.activity.unit.toLowerCase(); 

        if (unidadeFormatada === '1ª unidade') {
          unidadeFormatada = '1ª Unidade';
        } else if (unidadeFormatada === '2ª unidade') {
          unidadeFormatada = '2ª Unidade';
        } else if (unidadeFormatada.toLowerCase() === 'prova final') {
          unidadeFormatada = 'Prova Final';
        }

        const notaAtual = notasPorUnidade.get(unidadeFormatada) || 0;
        notasPorUnidade.set(unidadeFormatada, notaAtual + Number(grade.score));
      });

      
      const notasParaMedia = Array.from(notasPorUnidade.entries())
      .filter(([unidade, nota]) => unidade.toLowerCase() !== 'prova final');
      
      const todasAsNotas = notasParaMedia.map(([unidade, nota]) => nota);
      
      const media = todasAsNotas.length > 0
      ? todasAsNotas.reduce((acc, nota) => acc + nota, 0) / todasAsNotas.length
        : 0;

      const notas = Array.from(notasPorUnidade.entries()).map(([unidade, notaTotal]) => ({
        unidade,
        nota: notaTotal,
      }));
      
      const validGrades = enrollment.grades.filter(g => g.score !== null);
      
      const cargaHorariaTotal = enrollment.class.discipline.workLoad;

      if (cargaHorariaTotal === 0) {
        return {
          disciplina: enrollment.class.discipline.name,
          codigo: enrollment.class.code,
          media: 0, 
          frequencia: 100, 
          situacao: 'Em Andamento' as const,
          notas: [], 
          cor: 'gray', 
        };
      }

      const attendances = await this.attendanceRepository.find({ 
        where: { enrollment: { id: enrollment.id } } 
      });
      
      const totalHorasFalta = attendances.reduce((total, attendance) => {
        if (!attendance.present) {
          return total + attendance.classHour;
        }
        return total;
      }, 0);

      const horasPresente = cargaHorariaTotal - totalHorasFalta;
      const frequencia = (horasPresente / cargaHorariaTotal) * 100;
      
      const LIMITE_FALTAS_PERCENTUAL = 25;
      const limiteHorasFalta = cargaHorariaTotal * (LIMITE_FALTAS_PERCENTUAL / 100);


      const MIN_MEDIA = 7.0;
      const MIN_FREQUENCIA = 75;
      let situacao: 'Aprovado' | 'Reprovado' | 'Recuperação' | 'Em Andamento' = 'Em Andamento';
      
      const isFinished = this.isSemesterFinished(enrollment.class);

       if (!isFinished) {
        situacao = 'Em Andamento';
      } else {
        if (media >= MIN_MEDIA && totalHorasFalta <= limiteHorasFalta) {
          situacao = 'Aprovado';
        } else if (media >= 5.0 && media < MIN_MEDIA && frequencia >= MIN_FREQUENCIA) {
          situacao = 'Recuperação';
        } else if (totalHorasFalta > limiteHorasFalta) {
          situacao = 'Reprovado'; 
        } else {
          situacao = 'Reprovado';
        }
      }

      const cor = situacao === 'Aprovado' ? 'emerald' : 
                  situacao === 'Reprovado' ? 'red' : 
                  situacao === 'Recuperação' ? 'orange' : 
                  'blue';

      return {
        disciplina: enrollment.class.discipline.name,
        codigo: enrollment.class.code,
        media: parseFloat(media.toFixed(1)),
        frequencia: parseFloat(frequencia.toFixed(0)),
        situacao,
        notas,
        cor: cor,
      };
    });

    const disciplinas = await Promise.all(disciplinasPromises);
    
    const totalDisciplinas = disciplinas.length;
    const mediaGeral = totalDisciplinas > 0 
      ? disciplinas.reduce((acc, d) => acc + d.media, 0) / totalDisciplinas 
      : 0;
    const frequenciaGeral = totalDisciplinas > 0 
      ? disciplinas.reduce((acc, d) => acc + d.frequencia, 0) / totalDisciplinas 
      : 0;
    const disciplinasAprovadas = disciplinas.filter(d => d.situacao === 'Aprovado').length;

    return {
      geral: {
        mediaGeral: parseFloat(mediaGeral.toFixed(1)),
        frequenciaGeral: parseFloat(frequenciaGeral.toFixed(0)),
        disciplinasAprovadas,
        totalDisciplinas,
      },
      disciplinas,
    };
  }

  async getStudentFrequency(studentId: string, semestre: string): Promise<AttendanceData> {
    if (!semestre) {
      throw new BadRequestException('O parâmetro "semestre" é obrigatório.');
    }

    const student = await this.userRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Aluno com ID "${studentId}" não encontrado.`);
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { 
        student: { id: studentId },
        class: { semester: semestre }
      },
      relations: [
        'class',
        'class.discipline',
        'class.teacher',
        'attendances',
      ],
    });

    const disciplines = enrollments.map(enrollment => {
      const { discipline, teacher } = enrollment.class;
      const absences = enrollment.attendances.filter(a => !a.present);
      
      const absencesByUnit = { unit1: 0, unit2: 0 };

      const detailedAbsences: DetailedAbsence[] = absences.map(absence => {
        const date = new Date(absence.date);
        
        const unit = this.mapDateToUnit(date, enrollment.class.semester);
        
        if (unit === '1ª Unidade' ) {
          absencesByUnit.unit1 += absence.classHour;
        } else if (unit === '2ª Unidade' ) {
          absencesByUnit.unit2 += absence.classHour;
        }

        return {
          id: absence.id,
          date: absence.date,
          classHours: absence.classHour,
          reason: undefined,
          unit,
        };
      });

      return {
        id: enrollment.id,
        name: discipline.name,
        teacher: teacher ? teacher.name : 'Não definido',
        totalWorkload: discipline.workLoad,
        absencesByUnit,
        absences: detailedAbsences,
      };
    });

    const todosEnrollments = await this.enrollmentRepository.find({
        where: { student: { id: studentId } },
        relations: ['class'],
    });
    const availableSemesters = [...new Set(todosEnrollments.map(e => e.class.semester))].sort((a, b) => b.localeCompare(a));

    return {
      disciplines,
      availableSemesters,
    };
  }
  
  private mapDateToUnit(date: Date, semester: string): '1ª Unidade' | '2ª Unidade'  | 'Outra' {
      const month = date.getMonth() + 1;
      const [, semesterNumber] = semester.split('-').map(Number);
  
      if (semesterNumber === 1) { 
        return month <= 3 ? '1ª Unidade' : '2ª Unidade' ;
      } else if (semesterNumber === 2) {
        return month <= 9 ? '1ª Unidade' : '2ª Unidade' ;
      }
      
      return 'Outra';
  }


  private isSemesterFinished(classInstance: Class): boolean {
    const currentDate = new Date();
    const [year, semesterNumber] = classInstance.semester.split('-').map(Number);

    let semesterEndDate: Date;

    if (semesterNumber === 1) {
      semesterEndDate = new Date(year, 5, 30);
    } else {
      semesterEndDate = new Date(year, 12, 5);
    }

    return currentDate > semesterEndDate;
  }
}  