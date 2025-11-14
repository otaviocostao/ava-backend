import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private readonly bucketName = 'activities';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas no .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Faz upload de um arquivo para um bucket específico
   * @param bucket Nome do bucket
   * @param path Caminho completo no bucket (ex: class_id/material_id/teacher_id/filename)
   * @param file Buffer do arquivo
   * @param contentType Tipo MIME do arquivo
   * @returns URL pública do arquivo
   */
  async uploadFileTo(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw new InternalServerErrorException(`Erro ao fazer upload: ${error.message}`);
      }

      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Erro ao fazer upload do arquivo: ${error.message}`);
    }
  }

  /**
   * Faz upload de um arquivo para o bucket de atividades (compat)
   * @param file Buffer do arquivo
   * @param path Caminho completo no bucket (ex: class_id/activity_id/teacher/user_id/filename)
   * @param contentType Tipo MIME do arquivo
   * @returns URL pública do arquivo
   */
  async uploadFile(
    file: Buffer,
    path: string,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    return this.uploadFileTo(this.bucketName, path, file, contentType);
  }

  /**
   * Remove um arquivo de um bucket específico
   * @param bucket Nome do bucket
   * @param path Caminho completo do arquivo no bucket
   */
  async deleteFileFrom(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new InternalServerErrorException(`Erro ao remover arquivo: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Erro ao remover arquivo: ${error.message}`);
    }
  }

  /**
   * Remove um arquivo do bucket (compat)
   * @param path Caminho completo do arquivo no bucket
   */
  async deleteFile(path: string): Promise<void> {
    return this.deleteFileFrom(this.bucketName, path);
  }

  /**
   * Remove múltiplos arquivos de um bucket específico
   * @param bucket Nome do bucket
   * @param paths Array de caminhos completos dos arquivos
   */
  async deleteFilesFrom(bucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) {
      return;
    }

    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        throw new InternalServerErrorException(`Erro ao remover arquivos: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Erro ao remover arquivos: ${error.message}`);
    }
  }

  /**
   * Remove múltiplos arquivos do bucket (compat)
   * @param paths Array de caminhos completos dos arquivos
   */
  async deleteFiles(paths: string[]): Promise<void> {
    return this.deleteFilesFrom(this.bucketName, paths);
  }

  /**
   * Obtém a URL pública de um arquivo de um bucket específico
   * @param bucket Nome do bucket
   * @param path Caminho completo do arquivo no bucket
   * @returns URL pública do arquivo
   */
  getPublicUrlFrom(bucket: string, path: string): string {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Obtém a URL pública de um arquivo (compat)
   * @param path Caminho completo do arquivo no bucket
   * @returns URL pública do arquivo
   */
  getPublicUrl(path: string): string {
    return this.getPublicUrlFrom(this.bucketName, path);
  }

  /**
   * Extrai o caminho do arquivo a partir de uma URL pública do Supabase para um bucket específico
   * @param url URL pública do arquivo
   * @param bucket Nome do bucket
   * @returns Caminho relativo do arquivo no bucket
   */
  extractPathFromUrl(url: string, bucket: string = this.bucketName): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex((part) => part === bucket);
      
      if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
        return null;
      }

      return pathParts.slice(bucketIndex + 1).join('/');
    } catch {
      return null;
    }
  }

  /**
   * Extrai o caminho do arquivo a partir de uma URL pública (compat com bucket padrão)
   * @param url URL pública do arquivo
   * @returns Caminho relativo do arquivo no bucket
   */
  extractDefaultBucketPathFromUrl(url: string): string | null {
    return this.extractPathFromUrl(url, this.bucketName);
  }

  /**
   * Extrai o nome original do arquivo a partir do nome salvo no storage
   * Formato do nome salvo: {timestamp}-{nanoid}-{nomeOriginal}
   * @param fileName Nome do arquivo salvo no storage
   * @returns Nome original do arquivo (sem timestamp e nanoid)
   */
  extractOriginalFileName(fileName: string): string {
    // Remove timestamp e nanoid do início do nome
    // Formato: timestamp-nanoid-nomeOriginal
    const parts = fileName.split('-');
    if (parts.length >= 3) {
      // Remove os dois primeiros elementos (timestamp e nanoid)
      return parts.slice(2).join('-');
    }
    // Se não seguir o padrão, retorna o nome completo
    return fileName;
  }

  /**
   * Extrai o nome original do arquivo a partir de uma URL completa
   * @param url URL completa do arquivo
   * @returns Nome original do arquivo
   */
  extractOriginalFileNameFromUrl(url: string): string {
    const path = this.extractPathFromUrl(url);
    if (!path) {
      return 'arquivo';
    }
    const fileName = path.split('/').pop() || 'arquivo';
    return this.extractOriginalFileName(fileName);
  }

  /**
   * Faz download de um arquivo de um bucket específico
   * @param bucket Nome do bucket
   * @param path Caminho completo do arquivo no bucket
   * @returns Buffer do arquivo e nome do arquivo
   */
  async downloadFileFrom(bucket: string, path: string): Promise<{ buffer: Buffer; fileName: string }> {
    try {
      console.log('[DEBUG StorageService] Tentando fazer download do path:', path);
      console.log('[DEBUG StorageService] Bucket:', bucket);
      
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(path);

      console.log('[DEBUG StorageService] Download resultado - data:', !!data, 'error:', error);

      if (error) {
        console.error('[DEBUG StorageService] Erro detalhado:', {
          message: error.message,
          name: error.name,
          fullError: JSON.stringify(error, null, 2),
        });
        const errorMessage = error.message || JSON.stringify(error) || 'Erro desconhecido';
        throw new InternalServerErrorException(`Erro ao fazer download: ${errorMessage}`);
      }

      if (!data) {
        throw new InternalServerErrorException('Arquivo nao encontrado no storage.');
      }

      // Converte Blob para Buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extrai o nome do arquivo do path
      const fileName = path.split('/').pop() || 'arquivo';

      console.log('[DEBUG StorageService] Download concluido - tamanho:', buffer.length, 'bytes');

      return { buffer, fileName };
    } catch (error) {
      console.error('[DEBUG StorageService] Erro no catch:', error);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      const errorMessage = error?.message || error?.toString() || JSON.stringify(error) || 'Erro desconhecido';
      throw new InternalServerErrorException(`Erro ao fazer download do arquivo: ${errorMessage}`);
    }
  }

  /**
   * Faz download de um arquivo do bucket (compat)
   * @param path Caminho completo do arquivo no bucket
   * @returns Buffer do arquivo e nome do arquivo
   */
  async downloadFile(path: string): Promise<{ buffer: Buffer; fileName: string }> {
    return this.downloadFileFrom(this.bucketName, path);
  }
}



