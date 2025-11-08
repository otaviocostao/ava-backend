import { ValueTransformer } from 'typeorm';

/**
 * Transformer para garantir que fileUrls sempre seja salvo como array JSONB
 * e sempre seja retornado como array, mesmo se estiver salvo como string JSON
 */
export class FileUrlsTransformer implements ValueTransformer {
  /**
   * Ao salvar no banco: garante que seja um array JSONB válido
   */
  to(value: string[] | null | undefined): string[] | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Se já é um array, retorna diretamente
    if (Array.isArray(value)) {
      return value;
    }

    // Se não for array, retorna null (dados inválidos)
    return null;
  }

  /**
   * Ao ler do banco: converte string JSON para array se necessário
   */
  from(value: any): string[] | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Se já é um array, retorna diretamente
    if (Array.isArray(value)) {
      return value;
    }

    // Se é uma string, tenta fazer parse do JSON
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return null;
      } catch {
        return null;
      }
    }

    return null;
  }
}

