import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Class } from 'src/classes/entities/class.entity';
import { StorageService } from 'src/storage/storage.service';
import type { MulterFile } from 'src/common/types/multer.types';
import { nanoid } from 'nanoid';

@Injectable()
export class MaterialsService {
  
  constructor(
      @InjectRepository(Material)
      private readonly materialRepository: Repository<Material>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(Class)
      private readonly classRepository: Repository<Class>,
      private readonly storageService: StorageService,
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

  async findByClassId(classId: string): Promise<Material[]> {
    const materials = await this.materialRepository.find({ where: { class: { id: classId } } });

    if (!materials) {
      throw new NotFoundException(`Materiais da turma com ID "${classId}" não encontrados.`);
    }
    
    return materials;
  }

  /**
   * Upload múltiplos anexos para um material
   */
  async uploadMaterialAttachments(
    materialId: string,
    teacherId: string,
    files: MulterFile[],
  ): Promise<{
    materialId: string;
    uploaded: { url: string; name: string }[];
    fileUrl: string[];
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo fornecido.');
    }

    const material = await this.materialRepository.findOne({
      where: { id: materialId },
      relations: ['class'],
    });

    if (!material) {
      throw new NotFoundException(`Material com ID "${materialId}" não encontrado.`);
    }

    const classId = material.class.id;
    const bucket = 'materiais';

    const uploadedResults: { url: string; name: string }[] = [];

    for (const file of files) {
      const sanitizedOriginalName = file.originalname
        .normalize('NFKD')
        .replace(/[^\w.\- ]+/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_');

      const fileName = `${Date.now()}-${nanoid()}-${sanitizedOriginalName}`;
      const storagePath = `${classId}/${materialId}/${teacherId}/${fileName}`;

      const fileUrl = await this.storageService.uploadFileTo(
        bucket,
        storagePath,
        file.buffer,
        file.mimetype || 'application/octet-stream',
      );

      uploadedResults.push({
        url: fileUrl,
        name: this.storageService.extractOriginalFileNameFromUrl(fileUrl),
      });

      const current = material.fileUrl || [];
      material.fileUrl = [...current, fileUrl];
    }

    await this.materialRepository.save(material);

    return {
      materialId,
      uploaded: uploadedResults,
      fileUrl: material.fileUrl || [],
    };
  }

  /**
   * Lista anexos do material com nomes derivados das URLs
   */
  async listMaterialAttachments(materialId: string): Promise<{
    materialId: string;
    attachments: { url: string; name: string }[];
  }> {
    const material = await this.materialRepository.findOne({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Material com ID "${materialId}" não encontrado.`);
    }

    const bucket = 'materiais';
    const attachments = (material.fileUrl || []).map((url) => {
      const path = this.storageService.extractPathFromUrl(url, bucket);
      const fileName = path ? path.split('/').pop() || 'arquivo' : 'arquivo';
      const originalFileName = this.storageService.extractOriginalFileName(fileName);
      return {
        url,
        name: originalFileName,
      };
    });

    return { materialId, attachments };
  }

  /**
   * Remove um anexo específico do material
   */
  async removeMaterialAttachment(materialId: string, url: string): Promise<{
    materialId: string;
    removedUrl: string;
    fileUrl: string[];
  }> {
    if (!url) {
      throw new BadRequestException('URL do anexo é obrigatória.');
    }

    const material = await this.materialRepository.findOne({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Material com ID "${materialId}" não encontrado.`);
    }

    const bucket = 'materiais';
    const path = this.storageService.extractPathFromUrl(url, bucket);
    if (!path) {
      throw new BadRequestException('URL inválida para o bucket de materiais.');
    }

    await this.storageService.deleteFileFrom(bucket, path);

    const remaining = (material.fileUrl || []).filter((u) => u !== url);
    material.fileUrl = remaining;
    await this.materialRepository.save(material);

    return {
      materialId,
      removedUrl: url,
      fileUrl: remaining,
    };
  }

  /**
   * Faz download de um anexo específico de um material
   */
  async downloadMaterialAttachment(
    materialId: string,
    attachmentUrl: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const material = await this.materialRepository.findOne({
      where: { id: materialId },
      select: ['id', 'fileUrl'],
    });

    if (!material) {
      throw new NotFoundException(`Material com ID "${materialId}" não encontrado.`);
    }

    // Verifica se o anexo existe na lista de anexos do material
    const attachmentUrls = material.fileUrl || [];
    if (!attachmentUrls.includes(attachmentUrl)) {
      throw new NotFoundException('Anexo não encontrado neste material.');
    }

    // Extrai o path do arquivo da URL
    const bucket = 'materiais';
    const filePath = this.storageService.extractPathFromUrl(attachmentUrl, bucket);
    if (!filePath) {
      throw new BadRequestException('URL do anexo inválida.');
    }

    // Faz download do arquivo
    const { buffer, fileName } = await this.storageService.downloadFileFrom(bucket, filePath);
    
    // Extrai o nome original do arquivo (remove timestamp e nanoid)
    const originalFileName = this.storageService.extractOriginalFileName(fileName);
    
    return { buffer, fileName: originalFileName };
  }
}
