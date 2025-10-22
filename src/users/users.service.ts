import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ResponseUserDto } from './dto/response-user.dto';
import { Role } from 'src/roles/entities/role.entity';


@Injectable()
export class UsersService {

  constructor (
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    const existingUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('O e-mail informado já está em uso.');
    }

    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);

    return new ResponseUserDto(savedUser);
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<ResponseUserDto> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`Usuário com o ID '${id}' não encontrado.`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<ResponseUserDto> {
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

    return new ResponseUserDto(savedUser);
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
}
