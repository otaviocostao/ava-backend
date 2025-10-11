import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Class } from 'src/classes/entities/class.entity';

@Injectable()
export class MaterialsService {
  
  constructor(
      @InjectRepository(Material)
      private readonly materialRepository: Repository<Material>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(Class)
      private readonly classRepository: Repository<Class>,
  ) {}

  async create(createMaterialDto: CreateMaterialDto) : Promise<Material> {
    const { uploadedById, classId } = createMaterialDto;

    const uploader = await this.userRepository.findOneBy({ id: uploadedById });
    if (!uploader) {
      throw new NotFoundException(`Usuário com ID "${uploadedById}" não encontrado.`);
    }

    const classInstance = await this.classRepository.findOneBy({ id: classId });
    if (!classInstance) {
      throw new NotFoundException(`Turma com ID "${classId}" não encontrada.`);
    }

    const newMaterial = this.materialRepository.create({
      ...createMaterialDto,
      uploadedBy: { id: uploadedById },
      class: { id: classId },
    });

    return this.materialRepository.save(newMaterial);
  }

  findAll() {
    return this.materialRepository.find();
  }

  async findOne(id: string): Promise<Material> {
      const material = await this.materialRepository.findOne({
        where: { id },
        relations: ['uploadedBy', 'class', 'class.discipline'],
      });
  
      if (!material) {
        throw new NotFoundException(`Material com ID "${id}" não encontrado.`);
      }
      return material;
    }

  async update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<Material> {
      const material = await this.materialRepository.preload({ 
        id,
        ...updateMaterialDto,
      });
  
      if(!material){
        throw new NotFoundException(`Material com o ID '${id}' não encontrado.`)
      }
  
      return await this.materialRepository.save(material);
    }

  async remove(id: string): Promise<void> {
    const result = await this.materialRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Material com ID "${id}" não encontrado.`);
    }
  }
}
