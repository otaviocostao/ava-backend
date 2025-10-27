import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SetCoordinatorDto } from './dto/set-coordinator.dto';
import { User } from 'src/users/entities/user.entity';

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
  findAll() : Promise<Department[]> {

    return this.departmentRepository.find();
  }

  // Buscar Departamento por id
  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOneBy({ id });

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
    const department = await this.findOne(id);
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
}
