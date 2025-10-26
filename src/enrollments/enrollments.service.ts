import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Class } from 'src/classes/entities/class.entity';

interface FindEnrollmentsQuery {
  studentId?: string;
  classId?: string;
}

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  // Cria nova matricula de aluno
  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { studentId, classId } = createEnrollmentDto;

    const student = await this.userRepository.findOneBy({ id: studentId });
    if (!student) {
      throw new NotFoundException(`Aluno com ID "${studentId}" não encontrado.`);
    }

    const classInstance = await this.classRepository.findOneBy({ id: classId });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    const existingEnrollment = await this.enrollmentRepository.findOneBy({
      student: { id: studentId },
      class: { id: classId },
    });

    if (existingEnrollment) {
      throw new ConflictException('Este aluno já está matriculado nesta turma.');
    }

    const newEnrollment = this.enrollmentRepository.create({
      student: { id: studentId },
      class: { id: classId },
    });

    return this.enrollmentRepository.save(newEnrollment);
  }

  // Lista de matriculas
  findAll(query: FindEnrollmentsQuery): Promise<Enrollment[]> {
    const { studentId, classId } = query;

    return this.enrollmentRepository.find({
      where: {
        ...(studentId && { student: { id: studentId } }),
        ...(classId && { class: { id: classId } }),
      },
      relations: ['student', 'class', 'class.discipline'],
    });
  }

  // Buscar matricula pelo id
  async findOne(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['student', 'class', 'class.discipline', 'class.teacher'],
    });

    if (!enrollment) {
      throw new NotFoundException(`Matrícula com ID "${id}" não encontrada.`);
    }
    return enrollment;
  }

  // Remover matricula
  async remove(id: string): Promise<void> {
    const result = await this.enrollmentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Matrícula com ID "${id}" não encontrada.`);
    }
  }

  // Atualizar matricula
  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto): Promise<Enrollment> {
    const enrollment = await this.findOne(id);

    const { studentId, classId } = updateEnrollmentDto;

    if (studentId) {
      const student = await this.userRepository.findOneBy({ id: studentId });
      if (!student) {
        throw new NotFoundException(`Aluno com ID "${studentId}" não encontrado.`);
      }
      enrollment.student = student;
    }

    if (classId) {
      const classInstance = await this.classRepository.findOneBy({ id: classId });
      if (!classInstance) {
        throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
      }
      enrollment.class = classInstance;
    }

    const existingEnrollment = await this.enrollmentRepository.findOneBy({
      student: { id: enrollment.student.id },
      class: { id: enrollment.class.id },
    });

    if (existingEnrollment && existingEnrollment.id !== id) {
      throw new ConflictException('Este aluno já está matriculado nesta turma.');
    }

    return this.enrollmentRepository.save(enrollment);
  }
}
