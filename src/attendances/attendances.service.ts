import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Repository } from 'typeorm';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { AttendanceTableRowDto } from './dto/attendance-table.dto';
import { User } from 'src/users/entities/user.entity';
import { Class } from 'src/classes/entities/class.entity';

@Injectable()
export class AttendancesService {

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  private async ensureEnrollmentExists(enrollmentId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: ['student'],
    });

    if (!enrollment) {
      throw new NotFoundException(`Matricula com o ID '${enrollmentId}' nao encontrada.`);
    }

    return enrollment;
  }

  private async getAttendanceOrFail(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['student', 'enrollment'],
    });

    if (!attendance) {
      throw new NotFoundException(`Frequencia com o ID '${id}' nao encontrada.`);
    }

    return attendance;
  }

  private async ensureClassExists(classId: string): Promise<Class> {
    const classInstance = await this.classRepository.findOne({ where: { id: classId } });

    if (!classInstance) {
      throw new NotFoundException(`Turma com o ID '${classId}' nao encontrada.`);
    }

    return classInstance;
  }

  // Criar nova Frequencia e ligar ao aluno
  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    const enrollment = await this.ensureEnrollmentExists(createAttendanceDto.enrollment_id);

    const attendance = this.attendanceRepository.create({
      date: createAttendanceDto.date,
      present: createAttendanceDto.present ?? false,
      enrollment,
      student: enrollment.student,
    });

    return this.attendanceRepository.save(attendance);
  }

  // Buscar todas as Frequencias
  async findAll(): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      relations: ['student', 'enrollment'],
    });
  }

  // Buscar Frequencia por id
  async findOne(id: string): Promise<Attendance> {
    return this.getAttendanceOrFail(id);
  }

  //Atualizar Frequencia
  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.getAttendanceOrFail(id);

    if (updateAttendanceDto.enrollment_id && updateAttendanceDto.enrollment_id !== attendance.enrollment.id) {
      const enrollment = await this.ensureEnrollmentExists(updateAttendanceDto.enrollment_id);

      attendance.enrollment = enrollment;
      attendance.student = enrollment.student;
    }

    if (typeof updateAttendanceDto.present === 'boolean') {
      attendance.present = updateAttendanceDto.present;
    }

    if (updateAttendanceDto.date) {
      attendance.date = updateAttendanceDto.date;
    }

    return this.attendanceRepository.save(attendance);
  }

  // Excluir Attendance
  async remove(id: string): Promise<void> {
    const result = await this.attendanceRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Frequencia com o ID '${id}' nao encontrada.`);
    }
  }

  // Buscar todas as frequencias de uma matricula
  async findAllByEnrollment(enrollmentId: string): Promise<Attendance[]> {
    await this.ensureEnrollmentExists(enrollmentId);

    return this.attendanceRepository.find({
      where: { enrollment: { id: enrollmentId } },
      relations: ['student', 'enrollment'],
    });
  }

  // Buscar todas as frequencias de uma turma
  async findAllByClass(classId: string): Promise<Attendance[]> {
    await this.ensureClassExists(classId);

    return this.attendanceRepository.find({
      where: { enrollment: { class: { id: classId } } },
      relations: ['student', 'enrollment'],
    });
  }

  // Buscar todas as frequencias por aluno
  async findAllByStudent(studentId: string): Promise<Attendance[]> {
    const student = await this.userRepository.findOne({ where: { id: studentId } });

    if (!student) {
      throw new NotFoundException(`Aluno com o ID '${studentId}' nao encontrado.`);
    }

    return this.attendanceRepository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'enrollment'],
    });
  }

  // Montar a tabela de presencas para o front-end
  async getClassAttendanceTable(classId: string): Promise<AttendanceTableRowDto[]> {
    await this.ensureClassExists(classId);

    const enrollments = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('enrollment.attendances', 'attendance')
      .leftJoin('enrollment.class', 'class')
      .where('class.id = :classId', { classId })
      .orderBy('student.name', 'ASC')
      .addOrderBy('attendance.date', 'ASC')
      .getMany();

    return enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      studentId: enrollment.student.id,
      studentName: enrollment.student.name,
      attendances: (enrollment.attendances ?? [])
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((attendance) => ({
          attendanceId: attendance.id,
          date: attendance.date,
          present: attendance.present,
        })),
    }));
  }

  // Criar frequências em lote
  async createBatch(attendances: Array<{ enrollment_id: string; student_id: string; date: string; present: boolean }>): Promise<Attendance[]> {
    const createdAttendances: Attendance[] = [];

    for (const attendanceData of attendances) {
      const enrollment = await this.ensureEnrollmentExists(attendanceData.enrollment_id);

      // Verificar se já existe frequência para esta matrícula e data
      const existingAttendance = await this.attendanceRepository.findOne({
        where: {
          enrollment: { id: attendanceData.enrollment_id },
          date: attendanceData.date,
        },
      });

      if (existingAttendance) {
        // Atualizar existente
        existingAttendance.present = attendanceData.present;
        const updated = await this.attendanceRepository.save(existingAttendance);
        createdAttendances.push(updated);
      } else {
        // Criar novo
        const attendance = this.attendanceRepository.create({
          date: attendanceData.date,
          present: attendanceData.present,
          enrollment,
          student: enrollment.student,
        });
        const saved = await this.attendanceRepository.save(attendance);
        createdAttendances.push(saved);
      }
    }

    return createdAttendances;
  }
}
