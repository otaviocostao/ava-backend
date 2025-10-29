# Base Acadêmica - Departments

## Objetivo
Implementar CRUD de Departamentos e endpoint para coordenador, com validação e relação anulável.

## Endpoints
- POST `/departments`
- GET `/departments`
- GET `/departments/:id`
- PATCH `/departments/:id`
- DELETE `/departments/:id`
- PUT `/departments/:id/coordinator`

## Regras
- Validar o coordenador informado (usuário deve existir).
- Permitir remoção do coordenador, mantendo a relação nula quando removido.

## Tarefas
- [x] Criar documento de planejamento em docs/backend/departments.md
- [x] Permitir remoção do coordenador aceitando null no DTO
- [x] Verificar/controlador e serviço dos endpoints de departments
- [x] Atualizar documentação com status das tarefas
- [x] Criar documentação de testes curl (docs/backend/departments-curl.md)

## Notas Técnicas
- Entidade `Department` deve ter relação com `User` opcional e `onDelete: SET NULL`.
- DTO de coordenador deve aceitar `null` explicitamente e validar UUID apenas quando informado.
