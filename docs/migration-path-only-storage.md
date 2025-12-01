# Migração: Armazenar apenas Path em vez de Signed URLs

## Objetivo
Migrar as colunas que atualmente armazenam signed URLs completas para armazenar apenas o path relativo do arquivo no bucket. Isso elimina problemas de expiração de tokens e simplifica o armazenamento.

## Estado Atual
- **Materiais**: `Material.fileUrl` (array de strings) - armazena signed URLs completas
- **Submissões**: `ActivitySubmission.fileUrls` (array de strings) - armazena signed URLs completas
- **Outros**: Verificar outros modelos que possam armazenar URLs de storage

## Estratégia de Migração

### Fase 1: Preparação (Backend já compatível)
✅ **CONCLUÍDO**: O backend já extrai paths de URLs assinadas automaticamente
- `StorageService.extractPathFromUrl()` funciona com URLs assinadas
- Métodos de download já geram novas signed URLs a partir do path

### Fase 2: Migração de Dados (SQL)
Criar script SQL para migrar dados existentes:

```sql
-- Para Materiais
UPDATE materials
SET file_url = (
  SELECT jsonb_agg(
    CASE 
      WHEN url LIKE '%/storage/v1/object/sign/%' THEN
        -- Extrai path de URL assinada: /storage/v1/object/sign/bucket/path/to/file
        substring(url from '/storage/v1/object/sign/[^/]+/(.*?)(\?|$)')
      WHEN url LIKE '%/storage/v1/object/public/%' THEN
        -- Extrai path de URL pública: /storage/v1/object/public/bucket/path/to/file
        substring(url from '/storage/v1/object/public/[^/]+/(.*?)(\?|$)')
      WHEN url LIKE '%/storage/v1/object/%' THEN
        -- Extrai path de URL direta: /storage/v1/object/bucket/path/to/file
        substring(url from '/storage/v1/object/[^/]+/(.*?)(\?|$)')
      ELSE
        url -- Mantém como está se não conseguir extrair
    END
  )
  FROM jsonb_array_elements_text(file_url) AS url
)
WHERE file_url IS NOT NULL;

-- Para Submissões de Atividades
UPDATE activity_submissions
SET file_urls = (
  SELECT jsonb_agg(
    CASE 
      WHEN url LIKE '%/storage/v1/object/sign/%' THEN
        substring(url from '/storage/v1/object/sign/[^/]+/(.*?)(\?|$)')
      WHEN url LIKE '%/storage/v1/object/public/%' THEN
        substring(url from '/storage/v1/object/public/[^/]+/(.*?)(\?|$)')
      WHEN url LIKE '%/storage/v1/object/%' THEN
        substring(url from '/storage/v1/object/[^/]+/(.*?)(\?|$)')
      ELSE
        url
    END
  )
  FROM jsonb_array_elements_text(file_urls) AS url
)
WHERE file_urls IS NOT NULL;
```

### Fase 3: Atualizar Upload (Opcional)
Modificar métodos de upload para salvar apenas o path:

```typescript
// Em vez de:
const fileUrl = await this.storageService.uploadFileTo(bucket, path, file, contentType);
// fileUrl = "https://...supabase.co/storage/v1/object/sign/bucket/path?token=..."

// Fazer:
await this.storageService.uploadFileTo(bucket, path, file, contentType);
// Salvar apenas: "bucket/path/to/file.pdf" ou apenas "path/to/file.pdf"
```

### Fase 4: Atualizar Frontend (Se necessário)
Se o frontend esperar URLs completas para exibição, ajustar para:
- Backend retornar URLs assinadas temporárias na listagem (se necessário)
- Ou frontend construir URLs a partir do path quando necessário

## Vantagens
1. ✅ Sem expiração: paths nunca expiram
2. ✅ Menos espaço: paths são muito menores que URLs completas
3. ✅ Mais seguro: não expõe tokens no banco
4. ✅ Flexível: pode gerar signed URLs com diferentes expirações conforme necessário

## Considerações
- **Compatibilidade**: Backend atual já funciona com ambos os formatos
- **Rollback**: Se necessário, pode reverter mantendo URLs completas
- **Performance**: Paths são mais rápidos para comparar e processar

## Quando Implementar
- Após validação completa do sistema atual
- Durante manutenção programada
- Pode ser feito gradualmente (alguns registros por vez)

