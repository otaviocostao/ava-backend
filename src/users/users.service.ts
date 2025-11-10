import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

        let unidadeFormatada = grade.activity.unit.toLowerCase(); 

        if (unidadeFormatada === 'unidade 1') {
          unidadeFormatada = '1ª Unidade';
        } else if (unidadeFormatada === 'unidade 2') {
          unidadeFormatada = '2ª Unidade';
        } else if (unidadeFormatada.toLowerCase() === 'prova final') {
          unidadeFormatada = 'Prova Final';
        }

        const unidade = grade.activity.unit;
        const notaAtual = notasPorUnidade.get(unidade) || 0;

        notasPorUnidade.set(unidade, notaAtual + Number(grade.score));
      });

      const todasAsNotas = Array.from(notasPorUnidade.values());
      const media = todasAsNotas.length > 0
        ? todasAsNotas.reduce((acc, nota) => acc + nota, 0) / todasAsNotas.length
        : 0;

      const notas = Array.from(notasPorUnidade.entries()).map(([unidade, notaTotal]) => ({
        unidade,
        nota: notaTotal,
      }));


      const validGrades = enrollment.grades.filter(g => g.score !== null);
      
      
      const attendances = await this.attendanceRepository.find({ where: { enrollment: { id: enrollment.id } } });
      const totalAulas = attendances.length;
      const presencas = attendances.filter(a => a.present).length;
      const frequencia = totalAulas > 0 ? (presencas / totalAulas) * 100 : 100;

      const MIN_MEDIA = 7.0;
      const MIN_FREQUENCIA = 75;
      let situacao: 'Aprovado' | 'Reprovado' | 'Recuperação' | 'Em Andamento' = 'Em Andamento';
      
      const isFinished = this.isSemesterFinished(enrollment.class);

       if (!isFinished) {
        situacao = 'Em Andamento';
      } else {
        if (media >= MIN_MEDIA && frequencia >= MIN_FREQUENCIA) {
          situacao = 'Aprovado';
        } else if (media >= 4.0 && media < MIN_MEDIA && frequencia >= MIN_FREQUENCIA) {
          situacao = 'Recuperação';
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
  
  private calculateFinalGrade(grades: { score: number | null; maxScore: number | null }[]): number | null {
      const validGrades = grades.filter(g => g.score !== null && g.maxScore !== null && g.maxScore > 0);
      if (validGrades.length === 0) {
          return null;
      }
      const totalScore = validGrades.reduce((sum, g) => sum + (g.score! / g.maxScore!) * 10, 0);
      return parseFloat((totalScore / validGrades.length).toFixed(2));
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