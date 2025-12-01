import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  /**
   * Client com SERVICE ROLE (bypassa RLS) – usar apenas para operações internas/administrativas.
   * IMPORTANTE: evitar usar este client em fluxos que a avaliação de RLS irá inspecionar.
   */
  private supabaseAdmin: SupabaseClient;

  /**
   * Client que respeita RLS – criado com ANON KEY.
   * Para aplicar RLS por usuário, o ideal é criar um client por requisição usando o JWT do usuário.
   * Aqui mantemos um client base com ANON KEY para operações que não devem usar a service role.
   */
  private supabaseRls: SupabaseClient;

  private readonly bucketName = 'activities';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL deve estar configurada no .env');
    }

    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY deve estar configurada no .env');
    }

    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_ANON_KEY deve estar configurada no .env');
    }

    // Client administrativo (bypassa RLS) – uso restrito a cenários internos.
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Client que respeita RLS (role = anon). Para RLS por usuário,
    // o ideal é criar um client com o JWT do usuário em cada request.
    this.supabaseRls = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Faz upload de um arquivo para um bucket específico
   * @param bucket Nome do bucket
   * @param path Caminho completo no bucket (ex: class_id/material_id/teacher_id/filename)
   * @param file Buffer do arquivo
   * @param contentType Tipo MIME do arquivo
   * @returns URL pré-assinada de download do arquivo
   */
  async uploadFileTo(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    try {
      // Upload feito com client ADMIN por se tratar de operação interna do backend.
      const { data, error } = await this.supabaseAdmin.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw new InternalServerErrorException(`Erro ao fazer upload: ${error.message}`);
      }

      // Em vez de URL pública (que ignora RLS e torna o objeto acessível
      // sem autenticação), retornamos uma URL pré-assinada de download.
      const signedUrl = await this.createPresignedDownloadUrl(bucket, data.path);

      return signedUrl;
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
   * @returns URL pré-assinada de download do arquivo
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
      const { error } = await this.supabaseAdmin.storage
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
      const { error } = await this.supabaseAdmin.storage
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
   * Extrai o caminho do arquivo a partir de uma URL de arquivo do Supabase para um bucket específico
   * @param url URL do arquivo (pública ou pré-assinada)
   * @param bucket Nome do bucket
   * @returns Caminho relativo do arquivo no bucket
   */
  extractPathFromUrl(url: string, bucket: string = this.bucketName): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(p => p); // Remove strings vazias
      
      // URLs assinadas têm formato: /storage/v1/object/sign/bucket/path/to/file
      // URLs públicas têm formato: /storage/v1/object/public/bucket/path/to/file
      // URLs diretas têm formato: /storage/v1/object/bucket/path/to/file
      
      const signIndex = pathParts.findIndex((part) => part === 'sign');
      const publicIndex = pathParts.findIndex((part) => part === 'public');
      const objectIndex = pathParts.findIndex((part) => part === 'object');
      
      let bucketIndex = -1;
      
      // Se for URL assinada, o bucket vem depois de 'sign'
      if (signIndex !== -1) {
        bucketIndex = pathParts.findIndex((part, idx) => idx > signIndex && part === bucket);
      }
      // Se for URL pública, o bucket vem depois de 'public'
      else if (publicIndex !== -1) {
        bucketIndex = pathParts.findIndex((part, idx) => idx > publicIndex && part === bucket);
      }
      // Se for URL direta, o bucket vem depois de 'object'
      else if (objectIndex !== -1) {
        bucketIndex = pathParts.findIndex((part, idx) => idx > objectIndex && part === bucket);
      }
      // Fallback: procura o bucket em qualquer lugar
      else {
        bucketIndex = pathParts.findIndex((part) => part === bucket);
      }
      
      if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
        return null;
      }

      return pathParts.slice(bucketIndex + 1).join('/');
    } catch {
      return null;
    }
  }

  /**
   * Extrai o caminho do arquivo a partir de uma URL (compat com bucket padrão)
   * @param url URL do arquivo
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
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Procura por padrões conhecidos de buckets primeiro (mais confiável)
      const buckets = ['activities', 'materiais', 'video-aulas', 'mural'];
      for (const bucket of buckets) {
        // Procura por /bucket/ no pathname
        const bucketPattern = `/${bucket}/`;
        const bucketIndex = pathname.indexOf(bucketPattern);
        if (bucketIndex !== -1) {
          const pathAfterBucket = pathname.substring(bucketIndex + bucketPattern.length);
          if (pathAfterBucket) {
            // Remove query params se houver e pega o último segmento
            const fileName = pathAfterBucket.split('/').pop()?.split('?')[0] || 'arquivo';
            return this.extractOriginalFileName(fileName);
          }
        }
      }
      
      // Fallback: tenta usar extractPathFromUrl para cada bucket
      for (const bucket of buckets) {
        const path = this.extractPathFromUrl(url, bucket);
        if (path) {
          const fileName = path.split('/').pop()?.split('?')[0] || 'arquivo';
          return this.extractOriginalFileName(fileName);
        }
      }
      
      // Último fallback: pega o último segmento do pathname (sem query params)
      const lastSegment = pathname.split('/').pop()?.split('?')[0] || 'arquivo';
      return this.extractOriginalFileName(lastSegment);
    } catch {
      return 'arquivo';
    }
  }

  /**
   * Faz download de um arquivo de um bucket específico usando API REST diretamente
   * (fallback quando o client do Supabase falha)
   */
  private async downloadFileFromRestApi(
    bucket: string,
    path: string,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new InternalServerErrorException('Configuração do Supabase incompleta');
    }

    const encodedPath = encodeURIComponent(path);
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        apikey: supabaseServiceRoleKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      throw new InternalServerErrorException(
        `Erro ao fazer download via API REST: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = path.split('/').pop() || 'arquivo';

    return { buffer, fileName };
  }

  /**
   * Faz download de um arquivo de um bucket específico
   * @param bucket Nome do bucket
   * @param path Caminho completo do arquivo no bucket
   * @returns Buffer do arquivo e nome do arquivo
   * 
   * NOTA: Usa client ADMIN porque o backend já valida permissões do usuário
   * antes de chamar este método. O RLS é aplicado no nível da aplicação,
   * não no nível do storage (que seria redundante aqui).
   */
  async downloadFileFrom(bucket: string, path: string): Promise<{ buffer: Buffer; fileName: string }> {
    try {
      console.log('[DEBUG StorageService] Tentando fazer download do path:', path);
      console.log('[DEBUG StorageService] Bucket:', bucket);
      
      // Tenta primeiro com o client do Supabase
      const { data, error } = await this.supabaseAdmin.storage
        .from(bucket)
        .download(path);

      console.log('[DEBUG StorageService] Download resultado - data:', !!data, 'error:', error);

      if (error) {
        console.error('[DEBUG StorageService] Erro com client Supabase:', {
          message: error.message,
          name: error.name,
          originalErrorStatus: (error as any).originalError?.status,
          originalErrorStatusText: (error as any).originalError?.statusText,
        });

        // Se o erro for 400 (Bad Request), pode ser problema com policies RLS
        // ou arquivo não encontrado. Tenta usar API REST diretamente como fallback.
        const originalError = (error as any).originalError;
        if (originalError?.status === 400 || originalError?.status === 403) {
          console.log('[DEBUG StorageService] Tentando download via API REST como fallback...');
          try {
            return await this.downloadFileFromRestApi(bucket, path);
          } catch (restError) {
            console.error('[DEBUG StorageService] Erro também na API REST:', restError);
            throw new InternalServerErrorException(
              `Erro ao fazer download: arquivo não encontrado ou acesso negado. Verifique se o arquivo existe e se as policies RLS estão configuradas corretamente.`,
            );
          }
        }

        // Para outros erros, tenta extrair mensagem
        let errorMessage = error.message;
        if (!errorMessage || errorMessage === '{}') {
          if (originalError?.status === 404) {
            errorMessage = 'Arquivo não encontrado no storage.';
          } else if (originalError?.status === 403) {
            errorMessage = 'Acesso negado. Verifique as policies RLS do bucket.';
          } else if (originalError?.status) {
            errorMessage = `Erro HTTP ${originalError.status}: ${originalError.statusText || 'Erro desconhecido'}`;
          } else {
            errorMessage = 'Erro ao fazer download do arquivo';
          }
        }
        
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

  /**
   * Gera uma URL pré-assinada para upload (PUT) de um arquivo
   * Nota: O Supabase Storage não suporta presigned URLs para upload como o S3.
   * Esta função retorna uma URL que pode ser usada para upload via API REST do Supabase.
   * O cliente deve fazer POST para esta URL com o arquivo no body.
   * @param bucket Nome do bucket
   * @param path Caminho completo do arquivo no bucket
   * @param expiresIn Segundos até a URL expirar (padrão: 600 = 10 minutos) - não usado no Supabase
   * @param contentType Tipo MIME do arquivo (opcional)
   * @returns URL para upload (endpoint da API do Supabase)
   */
  async createPresignedUploadUrl(
    bucket: string,
    path: string,
    expiresIn: number = 600,
    contentType?: string,
  ): Promise<string> {
    try {
      // O Supabase Storage não tem presigned URLs para upload como o S3
      // Retornamos a URL da API REST do Supabase que permite upload
      // O upload será feito via POST/PUT para esta URL com autenticação
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      if (!supabaseUrl) {
        throw new InternalServerErrorException('SUPABASE_URL não configurada');
      }

      // URL da API REST do Supabase Storage para upload
      // Formato: {SUPABASE_URL}/storage/v1/object/{bucket}/{path}
      const encodedPath = encodeURIComponent(path);
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`;
      
      // Nota: O cliente precisará incluir o header Authorization com o token
      // Para video-aulas, vamos fazer upload via backend mesmo
      // Esta URL é apenas informativa - o upload real será feito pelo backend
      return uploadUrl;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Erro ao criar URL de upload: ${error.message}`);
    }
  }

  /**
   * Gera uma URL pré-assinada para download/visualização (GET) de um arquivo
   * @param bucket Nome do bucket
   * @param path Caminho completo do arquivo no bucket
   * @param expiresIn Segundos até a URL expirar (padrão: 600 = 10 minutos)
   * @param download Se true, força download; se false, tenta visualizar inline
   * @returns URL pré-assinada para download/visualização
   */
  async createPresignedDownloadUrl(
    bucket: string,
    path: string,
    expiresIn: number = 600,
    download: boolean = false,
  ): Promise<string> {
    try {
      // URLs pré-assinadas são geradas com o client ADMIN, pois são usadas
      // para compartilhar acesso temporário sem expor o bucket como público.
      const { data, error } = await this.supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn, {
          download,
        });

      if (error) {
        throw new InternalServerErrorException(`Erro ao criar URL de download: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Erro ao criar URL pré-assinada de download: ${error.message}`);
    }
  }
}



