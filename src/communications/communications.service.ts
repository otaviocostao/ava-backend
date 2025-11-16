import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Course } from 'src/courses/entities/course.entity';
import { StudentCourse } from 'src/student-courses/entities/student-course.entity';
import { FindRecipientsDto, RecipientRoleFilter } from './dto/find-recipients.dto';

interface Recipient {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class CommunicationsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(StudentCourse)
    private readonly studentCourseRepository: Repository<StudentCourse>,
  ) {}

  async findRecipients(query: FindRecipientsDto): Promise<{ data: Recipient[]; total: number; page: number; limit: number; totalPages: number }> {
    const role = query.role;
    const coordinatorId = query.coordinatorId;
    const search = (query.q ?? '').trim().toLowerCase();
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const offset = (page - 1) * limit;

    let qb: SelectQueryBuilder<User> = this.userRepository
      .createQueryBuilder('u')
      .leftJoin('u.roles', 'r')
      .select(['u.id', 'u.name', 'u.email'])
      .where('r.name = :roleName', { roleName: role });

    if (role === RecipientRoleFilter.TEACHER) {
      // teachers vinculados a departamentos coordenados pelo coordinatorId
      qb = qb
        .leftJoin('department_teachers', 'dt', 'dt.user_id = u.id')
        .leftJoin('departments', 'd', 'd.id = dt.department_id')
        .andWhere('d.coordinator_id = :coordinatorId', { coordinatorId });
    } else if (role === RecipientRoleFilter.STUDENT) {
      // alunos em cursos pertencentes a departamentos coordenados pelo coordinatorId
      qb = qb
        .leftJoin('student_courses', 'sc', 'sc.student_id = u.id')
        .leftJoin('courses', 'c', 'c.id = sc.course_id')
        .leftJoin('departments', 'd', 'd.id = c.department_id')
        .andWhere('d.coordinator_id = :coordinatorId', { coordinatorId });
    } else if (role === RecipientRoleFilter.COORDINATOR) {
      // todos coordenadores (sem filtro por departamento)
      // nenhuma junção adicional necessária
    }

    if (search) {
      qb = qb.andWhere('(LOWER(u.name) LIKE :search OR LOWER(u.email) LIKE :search)', { search: `%${search}%` });
    }

    // eliminar duplicados por junções
    qb = qb.distinct(true);

    const [rows, total] = await qb.orderBy('u.name', 'ASC').skip(offset).take(limit).getManyAndCount();

    const data: Recipient[] = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}


