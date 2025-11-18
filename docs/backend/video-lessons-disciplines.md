# Video Lessons por Disciplina

## Objetivo
Atualizar os endpoints e o armazenamento das video-aulas para usar `discipline_id` no lugar de `class_id`, e padronizar o caminho no bucket como `video-aulas/{disciplineId}/{videoUuid}.{ext}`. Não haverá migração de dados (legado será excluído).

## Novas Rotas
- POST `POST /video-lessons/disciplines/{disciplineId}/video-lessons` — cria a video-aula e retorna URL de upload
- GET `GET /video-lessons/disciplines/{disciplineId}/video-lessons` — lista video-aulas da disciplina
- GET `GET /video-lessons/disciplines/{disciplineId}/video-lessons/{id}` — obtém detalhes
- GET `GET /video-lessons/disciplines/{disciplineId}/video-lessons/{id}/stream-url` — URL de stream temporária
- PATCH `PATCH /video-lessons/disciplines/{disciplineId}/video-lessons/{id}` — atualiza metadados
- DELETE `DELETE /video-lessons/disciplines/{disciplineId}/video-lessons/{id}` — remove (soft delete)
- Upload/listagem/remoção de anexos mantidos em:
  - POST `/video-lessons/:id/attachments`
  - GET `/video-lessons/:id/attachments`
  - DELETE `/video-lessons/:id/attachments?url=...`

Observação: o prefixo do controller é `@Controller('video-lessons')`, por isso as rotas acima começam com `/video-lessons/...`.

## Padrão de Bucket (Supabase Storage)
- Vídeo principal: `video-aulas/{disciplineId}/{videoUuid}.{ext}`
- Anexos: `video-aulas/{disciplineId}/{videoUuid}/attachments/{uuid2}-{nomeArquivo}`

Exemplo:
- Vídeo: `video-aulas/1a2b-...-9z/7y6x5w4v.mp4`
- Anexo: `video-aulas/1a2b-...-9z/7y6x5w4v/attachments/abc123-slides.pdf`

## Regras de Acesso (por disciplina)
- Professor: é autorizado se for professor de ao menos uma turma que pertença à disciplina.
- Aluno: é autorizado se estiver matriculado em qualquer turma da disciplina.

## Breaking Changes
- Entidade `VideoLesson` agora referencia `discipline_id` (antes `class_id`).
- Rotas trocam `classes/:classId/...` por `disciplines/:disciplineId/...`.
- `objectKey` deixa de depender do `classId`/`teacherId` e passa a usar `{disciplineId}/{videoUuid}.{ext}`.
- O projeto usa `synchronize: true`; não foi criada migration manual.

## Checklist
- [x] Entidade `VideoLesson` atualizada para `discipline_id`
- [x] Service ajustado para `disciplineId` e permissões por disciplina
- [x] Padrão do bucket atualizado (vídeo e anexos)
- [x] Rotas e Swagger atualizados para `/disciplines/:disciplineId/...`
- [x] DTOs atualizados (`disciplineId`)
- [x] Módulo inclui `Discipline` no `TypeOrmModule.forFeature`
- [x] Documentação criada (este arquivo)
- [x] Sem migration manual (sincronização automática)

## Exemplo de Resposta (criação com URL de upload)
```json
{
  "id": "a0b12c3d-4e5f-6789-0123-456789abcdef",
  "objectKey": "video-aulas/1a2b3c4d-.../7y6x5w4v.mp4",
  "uploadUrl": "https://<supabase>/storage/v1/object/video-aulas/1a2b3c4d-.../7y6x5w4v.mp4",
  "expiresInSeconds": 600
}
```

## Observações
- Endpoints “legados” por turma foram removidos/trocados pelo formato por disciplina.
- O campo `visibility` mantém valores anteriores (`class | private | public`) apenas por compatibilidade semântica de UI.

