import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseInterceptors, UploadedFiles, Query, ParseUUIDPipe, Header, Res } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { MulterFile } from 'src/common/types/multer.types';
import type { Response } from 'express';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publica um novo material para a turma.' })
  @ApiCreatedResponse({
    description: 'Material criado com sucesso.',
    schema: {
      example: {
        id: '0d2a7c1e-8e1a-4a7f-8f29-3f5a6c7d8e9f',
        class: { id: '5a2b1f6e-5b9a-4ed5-8aa9-3c8e9c9a1a10' },
        title: 'Slides - Introdução à Programação',
        description: 'Apresentação sobre conceitos básicos de programação.',
        fileUrl: [],
        uploadedBy: { id: 'c2e7e4a0-8a4a-4df1-9f3c-1b4d2f5e7a90' },
        uploadedAt: '2025-01-01T00:00:00.000Z'
      }
    }
  })
  create(@Body() createMaterialDto: CreateMaterialDto) {
    return this.materialsService.create(createMaterialDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os materiais disponíveis.' })
  @ApiOkResponse({
    description: 'Lista de materiais retornada com sucesso.',
    schema: {
      example: [
        {
          id: '0d2a7c1e-8e1a-4a7f-8f29-3f5a6c7d8e9f',
          class: { id: '5a2b1f6e-5b9a-4ed5-8aa9-3c8e9c9a1a10' },
          title: 'Slides - Introdução à Programação',
          description: 'Apresentação sobre conceitos básicos de programação.',
          fileUrl: ['https://storage.../materiais/{class}/{material}/{teacher}/arquivo.pdf'],
          uploadedBy: { id: 'c2e7e4a0-8a4a-4df1-9f3c-1b4d2f5e7a90' },
          uploadedAt: '2025-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  findAll() {
    return this.materialsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de um material específico.' })
  @ApiParam({ name: 'id', description: 'ID do material', type: String })
  @ApiOkResponse({
    description: 'Material encontrado.',
    schema: {
      example: {
        id: '0d2a7c1e-8e1a-4a7f-8f29-3f5a6c7d8e9f',
        class: { id: '5a2b1f6e-5b9a-4ed5-8aa9-3c8e9c9a1a10' },
        title: 'Slides - Introdução à Programação',
        description: 'Apresentação sobre conceitos básicos de programação.',
        fileUrl: ['https://storage.../materiais/{class}/{material}/{teacher}/arquivo.pdf'],
        uploadedBy: { id: 'c2e7e4a0-8a4a-4df1-9f3c-1b4d2f5e7a90' },
        uploadedAt: '2025-01-01T00:00:00.000Z'
      }
    }
  })
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza as informações de um material.' })
  @ApiParam({ name: 'id', description: 'ID do material', type: String })
  @ApiOkResponse({
    description: 'Material atualizado com sucesso.',
    schema: {
      example: {
        id: '0d2a7c1e-8e1a-4a7f-8f29-3f5a6c7d8e9f',
        class: { id: '5a2b1f6e-5b9a-4ed5-8aa9-3c8e9c9a1a10' },
        title: 'Slides - Introdução à Programação (v2)',
        description: 'Versão revisada.',
        fileUrl: ['https://storage.../materiais/{class}/{material}/{teacher}/arquivo.pdf'],
        uploadedBy: { id: 'c2e7e4a0-8a4a-4df1-9f3c-1b4d2f5e7a90' },
        uploadedAt: '2025-01-01T00:00:00.000Z'
      }
    }
  })
  update(@Param('id') id: string, @Body() updateMaterialDto: UpdateMaterialDto) {
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um material do acervo.' })
  @ApiParam({ name: 'id', description: 'ID do material', type: String })
  @ApiNoContentResponse({ description: 'Material removido com sucesso.' })
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lista todos os materiais de uma turma específica.' })
  @ApiParam({ name: 'classId', description: 'ID da turma', type: String })
  @ApiOkResponse({
    description: 'Lista de materiais da turma.',
    schema: {
      example: [
        {
          id: '0d2a7c1e-8e1a-4a7f-8f29-3f5a6c7d8e9f',
          class: { id: '5a2b1f6e-5b9a-4ed5-8aa9-3c8e9c9a1a10' },
          title: 'Slides - Introdução à Programação',
          description: 'Apresentação sobre conceitos básicos de programação.',
          fileUrl: ['https://storage.../materiais/{class}/{material}/{teacher}/arquivo.pdf'],
          uploadedBy: { id: 'c2e7e4a0-8a4a-4df1-9f3c-1b4d2f5e7a90' },
          uploadedAt: '2025-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  findByClassId(@Param('classId') classId: string) {
    return this.materialsService.findByClassId(classId);
  }

  // ========== ANEXOS DO PROFESSOR (Materiais) ==========
  @Post(':materialId/attachments')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiTags('Materials - Anexos (Professor)')
  @ApiOperation({
    summary: 'Faz upload de anexos do professor para um material (múltiplos arquivos).',
    description:
      'Os arquivos serão salvos no path: materiais/{classId}/{materialId}/{teacherId}/{arquivo}. Aceita até 10 arquivos por requisição.',
  })
  @ApiParam({ name: 'materialId', description: 'ID do material', type: String })
  @ApiQuery({ name: 'teacherId', description: 'ID do professor', type: String })
  @ApiBody({
    description: 'Arquivos a serem enviados como anexos do material (múltiplos arquivos)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Selecione múltiplos arquivos para upload (até 10 arquivos)'
        }
      },
      required: ['files']
    }
  })
  @ApiOkResponse({
    description: 'Upload realizado com sucesso.',
    schema: {
      example: {
        materialId: '0d2a7c1e-8e1a-4a7f-8f29-3f5a6c7d8e9f',
        uploaded: [
          {
            url: 'https://storage.../materiais/{class}/{material}/{teacher}/1700000000000-abc123-arquivo.pdf',
            name: 'arquivo.pdf'
          }
        ],
        fileUrl: ['https://storage.../materiais/{class}/{material}/{teacher}/1700000000000-abc123-arquivo.pdf']
      }
    }
  })
  uploadAttachments(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @UploadedFiles() files: MulterFile[],
    @Query('teacherId', ParseUUIDPipe) teacherId: string,
  ) {
    return this.materialsService.uploadMaterialAttachments(materialId, teacherId, files);
  }

  @Get(':materialId/attachments')
  @ApiTags('Materials - Anexos (Professor)')
  @ApiOperation({
    summary: 'Lista anexos do material.',
  })
  @ApiParam({ name: 'materialId', description: 'ID do material', type: String })
  @ApiOkResponse({
    description: 'Lista de anexos.',
    schema: {
      example: {
        materialId: '0d2a7c1e-8e1a-4a7f-8f29-3f5a6c7d8e9f',
        attachments: [
          {
            url: 'https://storage.../materiais/{class}/{material}/{teacher}/1700000000000-abc123-arquivo.pdf',
            name: 'arquivo.pdf'
          }
        ]
      }
    }
  })
  listAttachments(@Param('materialId', ParseUUIDPipe) materialId: string) {
    return this.materialsService.listMaterialAttachments(materialId);
  }

  @Get(':materialId/attachments/download')
  @ApiTags('Materials - Anexos (Professor)')
  @ApiOperation({ summary: 'Faz download de um anexo específico de um material.' })
  @ApiParam({ name: 'materialId', description: 'ID do material', type: String })
  @ApiQuery({ name: 'attachmentUrl', description: 'URL do anexo a ser baixado', type: String })
  @Header('Content-Type', 'application/octet-stream')
  async downloadAttachment(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Query('attachmentUrl') attachmentUrl: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.materialsService.downloadMaterialAttachment(
      materialId,
      attachmentUrl,
    );

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Delete(':materialId/attachments')
  @ApiTags('Materials - Anexos (Professor)')
  @ApiOperation({
    summary: 'Remove um anexo específico do material.',
  })
  @ApiParam({ name: 'materialId', description: 'ID do material', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  })
  @ApiOkResponse({
    description: 'Anexo removido com sucesso.',
    schema: {
      example: {
        materialId: '0d2a7c1e-8e1a-4a7f-8f29-3f5a6c7d8e9f',
        removedUrl: 'https://storage.../materiais/{class}/{material}/{teacher}/1700000000000-abc123-arquivo.pdf',
        fileUrl: []
      }
    }
  })
  removeAttachment(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() body: { url: string },
  ) {
    return this.materialsService.removeMaterialAttachment(materialId, body?.url);
  }
}
