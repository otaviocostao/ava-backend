import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
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

  private buildFilters(query: FindEnrollmentsQuery): FindOptionsWhere<Enrollment> {
    const where: FindOptionsWhere<Enrollment> = {};

    if (query.studentId) {
      where.student = { id: query.studentId } as FindOptionsWhere<User>;
    }

    if (query.classId) {
      where.class = { id: query.classId } as FindOptionsWhere<Class>;
    }

    return where;
  }

  private async ensureStudentExists(studentId: string): Promise<User> {
    const student = await this.userRepository.findOne({ where: { id: studentId } });

    if (!student) {
      throw new NotFoundException(`Aluno com ID "${studentId}" nao encontrado.`);
    }

    return student;
  }

  private async ensureClassExists(classId: string): Promise<Class> {
    const classInstance = await this.classRepository.findOne({ where: { id: classId } });

    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" nao encontrada.`);
    }

    return classInstance;
  }

  private async findOneByFilters(filters: FindEnrollmentsQuery): Promise<Enrollment | null> {
    const where = this.buildFilters(filters);

    if (!Object.keys(where).length) {
      return null;
    }

    return this.enrollmentRepository.findOne({ where });
  }

  // Cria nova matricula de aluno
  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { studentId, classId } = createEnrollmentDto;

    const [student, classInstance] = await Promise.all([
      this.ensureStudentExists(studentId),
      this.ensureClassExists(classId),
    ]);

    const existingEnrollment = await this.findOneByFilters({ studentId, classId });

    if (existingEnrollment) {
      throw new ConflictException('Este aluno ja esta matriculado nesta turma.');
    }

    const newEnrollment = this.enrollmentRepository.create({
      student: { id: student.id },
      class: { id: classInstance.id },
    });

    return this.enrollmentRepository.save(newEnrollment);
  }

  // Lista de matriculas
  findAll(query: FindEnrollmentsQuery): Promise<Enrollment[]> {
    const where = this.buildFilters(query);

    return this.enrollmentRepository.find({
      where,
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
      throw new NotFoundException(`Matricula com ID "${id}" nao encontrada.`);
    }

    return enrollment;
  }

  // Remover matricula
  async remove(id: string): Promise<void> {
    const result = await this.enrollmentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Matricula com ID "${id}" nao encontrada.`);
    }
  }

  // Atualizar matricula
  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto): Promise<Enrollment> {
    const enrollment = await this.findOne(id);

    const { studentId, classId } = updateEnrollmentDto;

    if (studentId) {
      enrollment.student = await this.ensureStudentExists(studentId);
    }

    if (classId) {
      enrollment.class = await this.ensureClassExists(classId);
    }

    const existingEnrollment = await this.findOneByFilters({
      studentId: enrollment.student.id,
      classId: enrollment.class.id,
    });

    if (existingEnrollment && existingEnrollment.id !== id) {
      throw new ConflictException('Este aluno ja esta matriculado nesta turma.');
    }

    return this.enrollmentRepository.save(enrollment);
  }
}
