# Base Acadêmica - Departments

## Objetivo
Implementar CRUD de Departamentos, endpoint para coordenador e gestão de professores vinculados ao departamento, com validação e relação anulável.

## Endpoints

### CRUD de Departamentos
- POST `/departments` - Cria um novo departamento
- GET `/departments?coordinatorId=UUID` - Lista todos os departamentos (opcionalmente filtra por coordenador)
- GET `/departments/:id` - Busca um departamento específico pelo ID
- PATCH `/departments/:id` - Atualiza as informações de um departamento
- DELETE `/departments/:id` - Remove um departamento existente

### Coordenador
- PUT `/departments/:id/coordinator` - Define ou remove o coordenador de um departamento

### Professores do Departamento
- GET `/departments/:id/teachers` - Lista todos os professores vinculados a um departamento
- POST `/departments/:id/teachers` - Adiciona um ou mais professores a um departamento (valida que todos possuem role "teacher")
- DELETE `/departments/:id/teachers/:userId` - Remove um professor de um departamento

### Usuários (opcional)
- GET `/users/:id/departments` - Lista todos os departamentos em que um usuário (professor) está vinculado

## Regras
- Validar o coordenador informado (usuário deve existir).
- Permitir remoção do coordenador, mantendo a relação nula quando removido.
- Professores podem pertencer a múltiplos departamentos (relação Many-to-Many).
- Ao adicionar professores, validar que todos possuem a role "teacher".
- Evitar duplicação de vínculos ao adicionar professores já vinculados.

## Tarefas
- [x] Criar documento de planejamento em docs/backend/departments.md
- [x] Permitir remoção do coordenador aceitando null no DTO
- [x] Verificar/controlador e serviço dos endpoints de departments
- [x] Atualizar documentação com status das tarefas
- [x] Criar documentação de testes curl (docs/backend/departments-curl.md)

## Notas Técnicas
- Entidade `Department` deve ter relação com `User` opcional e `onDelete: SET NULL`.
- DTO de coordenador deve aceitar `null` explicitamente e validar UUID apenas quando informado.
- Relação Many-to-Many entre `Department` e `User` (professores) via tabela `department_teachers`.
- Professores são identificados pela role "teacher" no sistema de roles.
- A tabela `department_teachers` é criada automaticamente pelo TypeORM (synchronize: true).

## Documentação de Testes
- Ver `docs/backend/departments-teachers-curl.md` para exemplos de testes cURL dos novos endpoints.
