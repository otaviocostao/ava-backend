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


@Injectable()
export class UsersService {

  constructor (
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>
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

  async getStudentGradebook(studentId: string): Promise<GradebookEntryDto[]> {
    const student = await this.userRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Aluno com ID "${studentId}" não encontrado.`);
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: [
        'class',
        'class.discipline',
        'class.teacher',
        'grades',
        'grades.activity',
      ],
    });

    if (!enrollments.length) {
      return [];
    }

    const gradebook = enrollments.map((enrollment) => {
      const grades = enrollment.grades.map((grade) => ({
        activityTitle: grade.activity.title,
        activityType: grade.activity.type,
        dueDate: grade.activity.dueDate,
        score: grade.score !== null ? parseFloat(grade.score as any) : null,
        maxScore: grade.activity.maxScore !== null ? parseFloat(grade.activity.maxScore as any) : null,
      }));
      

      const gradebookEntry: GradebookEntryDto = {
        classId: enrollment.class.id,
        className: enrollment.class.discipline.name,
        classCode: enrollment.class.code,
        teacherName: enrollment.class.teacher ? enrollment.class.teacher.name : 'Não definido',
        grades: grades,
      };

      return gradebookEntry;
    });

    return gradebook;
  }
  
  private calculateFinalGrade(grades: { score: number | null; maxScore: number | null }[]): number | null {
      const validGrades = grades.filter(g => g.score !== null && g.maxScore !== null && g.maxScore > 0);
      if (validGrades.length === 0) {
          return null;
      }
      const totalScore = validGrades.reduce((sum, g) => sum + (g.score! / g.maxScore!) * 10, 0);
      return parseFloat((totalScore / validGrades.length).toFixed(2));
  }
}  