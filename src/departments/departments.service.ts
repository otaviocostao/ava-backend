import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SetCoordinatorDto } from './dto/set-coordinator.dto';
import { User } from 'src/users/entities/user.entity';
import { AddTeachersDto } from './dto/add-teachers.dto';

@Injectable()
export class DepartmentsService {

  constructor (
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Criar nova Departamento
  async create(createDepartmentDto: CreateDepartmentDto) {
    const existingDepartment = await this.departmentRepository.findOneBy({
      name: createDepartmentDto.name,
    })

    if(existingDepartment){
      throw new ConflictException('Este Departamento já foi criado.')
    }

    const department = this.departmentRepository.create(createDepartmentDto);

    return await this.departmentRepository.save(department);
  }

  // Buscar todas as Departamento
  async findAll(coordinatorId?: string): Promise<Department[]> {
    if (coordinatorId) {
      // Usar innerJoin para retornar apenas departamentos que têm coordenador com o ID especificado
      return this.departmentRepository
        .createQueryBuilder('department')
        .innerJoinAndSelect('department.coordinator', 'coordinator')
        .where('coordinator.id = :coordinatorId', { coordinatorId })
        .getMany();
    }
    return this.departmentRepository.find({
      relations: ['coordinator'],
    });
  }

  // Buscar Departamento por id
  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['coordinator', 'teachers', 'teachers.roles'],
    });

    if(!department){
      throw new NotFoundException(`Departamento com o ID '${id}' não encontrado.`)
    }
    return department;
  }

  //Atualizar Departamento
  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.departmentRepository.preload({ 
      id,
      ...updateDepartmentDto,
    });

    if(!department){
      throw new NotFoundException(`Departamento com o ID '${id}' não encontrado.`)
    }

    return await this.departmentRepository.save(department);
  }

  // Excluir Department
  async remove(id: string): Promise<void> {
    const result = await this.departmentRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Deparatamento com o ID '${id}' não encontrado.`);
    }
  }

  async setCoordinator(id: string, { coordinatorId }: SetCoordinatorDto): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['coordinator'],
    });

    if (!department) {
      throw new NotFoundException(`Departamento com o ID '${id}' não encontrado.`);
    }

    if (coordinatorId) {
      const coordinator = await this.userRepository.findOneBy({ id: coordinatorId });
      if (!coordinator) {
        throw new NotFoundException(
          `Coordenador com o ID '${coordinatorId}' não encontrado.`,
        );
      }
      department.coordinator = coordinator;
    } else {
      department.coordinator = null;
    }
    return this.departmentRepository.save(department);
  }

  async getTeachers(id: string): Promise<User[]> {
    // Verificar se o departamento existe
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Departamento com o ID '${id}' não encontrado.`);
    }

    // Usar QueryBuilder para carregar professores diretamente da tabela de junção
    const teachers = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('department_teachers', 'dt', 'dt.user_id = user.id')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('dt.department_id = :departmentId', { departmentId: id })
      .getMany();

    return teachers;
  }

  async addTeachers(id: string, { userIds }: AddTeachersDto): Promise<Department> {
    // Verificar se o departamento existe
    const department = await this.departmentRepository.findOne({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Departamento com o ID '${id}' não encontrado.`);
    }

    // Buscar todos os usuários de uma vez com suas roles
    const users = await this.userRepository.find({
      where: userIds.map(userId => ({ id: userId })),
      relations: ['roles'],
    });
    if (users.length !== userIds.length) {
      const foundIds = new Set(users.map(u => u.id));
      const missingIds = userIds.filter(uid => !foundIds.has(uid));
      throw new NotFoundException(
        `Usuário(s) com ID(s) '${missingIds.join(', ')}' não encontrado(s).`,
      );
    }

    // Validar que todos possuem role 'teacher'
    const usersWithoutTeacherRole = users.filter(
      user => !user.roles.some(role => role.name === 'teacher'),
    );
    if (usersWithoutTeacherRole.length > 0) {
      const names = usersWithoutTeacherRole.map(u => u.name).join(', ');
      throw new BadRequestException(
        `Os seguintes usuários não possuem a role 'teacher': ${names}`,
      );
    }

    // Evitar duplicação (comparar IDs já vinculados)
    const existingTeachers = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('department_teachers', 'dt', 'dt.user_id = user.id')
      .where('dt.department_id = :departmentId', { departmentId: id })
      .getMany();
    const existingTeacherIds = new Set(existingTeachers.map(t => t.id));
    const teachersToAdd = users.filter(u => !existingTeacherIds.has(u.id));
    if (teachersToAdd.length === 0) {
      throw new ConflictException(
        'Todos os professores informados já estão vinculados a este departamento.',
      );
    }

    // Inserir diretamente na tabela de junção (garante criação mesmo sem metadata de relação)
    await Promise.all(
      teachersToAdd.map((t) =>
        this.departmentRepository.manager.query(
          `INSERT INTO department_teachers (department_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (department_id, user_id) DO NOTHING`,
          [id, t.id],
        ),
      ),
    );

    return department; // retorno simples
  }

  async removeTeacher(id: string, userId: string): Promise<void> {
    // Verificar existência do departamento
    const department = await this.departmentRepository.findOne({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Departamento com o ID '${id}' não encontrado.`);
    }

    // Verificar se o vínculo existe
    const isLinked = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('department_teachers', 'dt', 'dt.user_id = user.id')
      .where('dt.department_id = :departmentId', { departmentId: id })
      .andWhere('dt.user_id = :userId', { userId })
      .getExists();

    if (!isLinked) {
      throw new NotFoundException(
        `Professor com o ID '${userId}' não está vinculado a este departamento.`,
      );
    }

    // Remover vínculo diretamente na tabela de junção
    await this.departmentRepository.manager.query(
      `DELETE FROM department_teachers WHERE department_id = $1 AND user_id = $2`,
      [id, userId],
    );
  }
}
