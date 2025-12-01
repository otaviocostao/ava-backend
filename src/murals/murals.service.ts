import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mural, MuralTargetRole } from './entities/mural.entity';
import { CreateMuralDto } from './dto/create-mural.dto';
import { UpdateMuralDto } from './dto/update-mural.dto';
import { StorageService } from '../storage/storage.service';
import type { MulterFile } from '../common/types/multer.types';

@Injectable()
export class MuralsService {
  private readonly bucketName = 'mural';

  constructor(
    @InjectRepository(Mural)
    private readonly muralRepository: Repository<Mural>,
    private readonly storageService: StorageService,
  ) {}

  async create(createMuralDto: CreateMuralDto, file: MulterFile): Promise<Mural> {
    if (!file) {
      throw new BadRequestException('Imagem é obrigatória para criar um mural.');
    }

    // Validar tipo de arquivo (apenas imagens)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Apenas imagens (jpg, jpeg, png, webp) são aceitas.',
      );
    }

    // Criar registro no banco primeiro para obter o ID
    const mural = this.muralRepository.create({
      title: createMuralDto.title,
      description: createMuralDto.description || null,
      targetRole: createMuralDto.targetRole,
      order: createMuralDto.order ?? null,
      isActive: createMuralDto.isActive ?? true,
      imageUrl: '', // Será atualizado após upload
    });

    const savedMural = await this.muralRepository.save(mural);

    // Sanitizar nome do arquivo
    const sanitizedOriginalName = file.originalname
      .normalize('NFKD')
      .replace(/[^\w.\- ]+/g, '')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_');

    const fileName = `${savedMural.id}-${Date.now()}-${sanitizedOriginalName}`;
    const storagePath = `${createMuralDto.targetRole}/${fileName}`;

    // Fazer upload da imagem
    const imageUrl = await this.storageService.uploadFileTo(
      this.bucketName,
      storagePath,
      file.buffer,
      file.mimetype,
    );

    // Atualizar com a URL da imagem
    savedMural.imageUrl = imageUrl;
    return this.muralRepository.save(savedMural);
  }

  /**
   * Lista todos os murais, gerando novas signed URLs para as imagens
   * Isso garante que as URLs não expirem e sempre funcionem
   */
  async findAll(targetRole?: MuralTargetRole): Promise<Mural[]> {
    const queryBuilder = this.muralRepository.createQueryBuilder('mural');

    if (targetRole) {
      queryBuilder.where('mural.targetRole = :targetRole', { targetRole });
    }

    const murais = await queryBuilder
      .orderBy('mural.order', 'ASC', 'NULLS LAST')
      .addOrderBy('mural.createdAt', 'DESC')
      .getMany();

    // Gera novas signed URLs para cada mural
    const muraisComUrlsFrescas = await Promise.all(
      murais.map(async (mural) => {
        if (!mural.imageUrl) {
          return mural;
        }

        try {
          // Extrai o path da URL armazenada (mesmo que o token tenha expirado)
          const imagePath = this.storageService.extractPathFromUrl(
            mural.imageUrl,
            this.bucketName,
          );

          if (!imagePath) {
            // Se não conseguir extrair o path, mantém a URL original
            return mural;
          }

          // Gera uma nova signed URL (válida por 1 hora)
          const freshImageUrl = await this.storageService.createPresignedDownloadUrl(
            this.bucketName,
            imagePath,
            3600, // 1 hora
            false, // não força download (é uma imagem para exibição)
          );

          // Retorna o mural com a nova URL
          return {
            ...mural,
            imageUrl: freshImageUrl,
          };
        } catch (error) {
          // Em caso de erro, retorna o mural com a URL original
          console.error(`Erro ao gerar signed URL para mural ${mural.id}:`, error);
          return mural;
        }
      }),
    );

    return muraisComUrlsFrescas;
  }

  /**
   * Busca um mural por ID, gerando uma nova signed URL para a imagem
   * Isso garante que a URL não expire e sempre funcione
   */
  async findOne(id: string): Promise<Mural> {
    const mural = await this.muralRepository.findOne({
      where: { id },
    });

    if (!mural) {
      throw new NotFoundException(`Mural com ID "${id}" não encontrado.`);
    }

    // Gera uma nova signed URL se houver imagem
    if (mural.imageUrl) {
      try {
        const imagePath = this.storageService.extractPathFromUrl(
          mural.imageUrl,
          this.bucketName,
        );

        if (imagePath) {
          const freshImageUrl = await this.storageService.createPresignedDownloadUrl(
            this.bucketName,
            imagePath,
            3600, // 1 hora
            false, // não força download (é uma imagem para exibição)
          );

          return {
            ...mural,
            imageUrl: freshImageUrl,
          };
        }
      } catch (error) {
        console.error(`Erro ao gerar signed URL para mural ${id}:`, error);
        // Retorna o mural com a URL original em caso de erro
      }
    }

    return mural;
  }

  async update(id: string, updateMuralDto: UpdateMuralDto, file?: MulterFile): Promise<Mural> {
    const mural = await this.findOne(id);

    // Se um novo arquivo foi enviado, validar e fazer upload
    if (file) {
      // Validar tipo de arquivo
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Tipo de arquivo não permitido. Apenas imagens (jpg, jpeg, png, webp) são aceitas.',
        );
      }

      // Remover arquivo antigo do storage
      if (mural.imageUrl) {
        const oldPath = this.storageService.extractPathFromUrl(mural.imageUrl, this.bucketName);
        if (oldPath) {
          await this.storageService.deleteFileFrom(this.bucketName, oldPath).catch(() => {
            // Ignora erros ao remover arquivo antigo
          });
        }
      }

      // Sanitizar nome do arquivo
      const sanitizedOriginalName = file.originalname
        .normalize('NFKD')
        .replace(/[^\w.\- ]+/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_');

      const targetRole = updateMuralDto.targetRole || mural.targetRole;
      const fileName = `${mural.id}-${Date.now()}-${sanitizedOriginalName}`;
      const storagePath = `${targetRole}/${fileName}`;

      // Fazer upload da nova imagem
      const imageUrl = await this.storageService.uploadFileTo(
        this.bucketName,
        storagePath,
        file.buffer,
        file.mimetype,
      );

      mural.imageUrl = imageUrl;
    }

    // Atualizar outros campos
    if (updateMuralDto.title !== undefined) {
      mural.title = updateMuralDto.title;
    }
    if (updateMuralDto.description !== undefined) {
      mural.description = updateMuralDto.description || null;
    }
    if (updateMuralDto.targetRole !== undefined) {
      mural.targetRole = updateMuralDto.targetRole;
    }
    if (updateMuralDto.order !== undefined) {
      mural.order = updateMuralDto.order ?? null;
    }
    if (updateMuralDto.isActive !== undefined) {
      mural.isActive = updateMuralDto.isActive;
    }

    return this.muralRepository.save(mural);
  }

  async remove(id: string): Promise<void> {
    const mural = await this.findOne(id);

    // Remover arquivo do storage
    if (mural.imageUrl) {
      const path = this.storageService.extractPathFromUrl(mural.imageUrl, this.bucketName);
      if (path) {
        await this.storageService.deleteFileFrom(this.bucketName, path).catch(() => {
          // Ignora erros ao remover arquivo (pode não existir mais)
        });
      }
    }

    // Remover registro do banco
    const result = await this.muralRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Mural com ID "${id}" não encontrado.`);
    }
  }
}

