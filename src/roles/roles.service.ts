import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {

  constructor (
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  // Criar nova Role
  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.roleRepository.findOneBy({
      name: createRoleDto.name,
    })

    if(existingRole){
      throw new ConflictException('Esta Role já foi criada.')
    }

    const role = this.roleRepository.create(createRoleDto);

    return await this.roleRepository.save(role);
  }

  // Buscar todas as Roles
  findAll() : Promise<Role[]> {

    return this.roleRepository.find();
  }

  // Buscar Role por id
  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id });

    if(!role){
      throw new NotFoundException(`Role com o ID '${id}' não encontrada.`)
    }
    return role;
  }

  //Atualizar Role
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    // Se o nome for informado na atualização, garantir unicidade
    if (updateRoleDto.name) {
      const conflict = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException('Já existe uma Role com esse nome.');
      }
    }

    const role = await this.roleRepository.preload({ 
      id,
      ...updateRoleDto,
    });

    if(!role){
      throw new NotFoundException(`Role com o ID '${id}' não encontrada.`)
    }

    return await this.roleRepository.save(role);
  }

  // Excluir Role
  async remove(id: string): Promise<void> {
    const result = await this.roleRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Role com o ID '${id}' não encontrada.`);
    }
  }
}
