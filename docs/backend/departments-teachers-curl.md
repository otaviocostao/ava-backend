# Testes cURL - Professores em Departamentos

## Variáveis de Ambiente
```bash
BASE_URL="http://localhost:3001"
TOKEN="seu_token_aqui"
DEPARTMENT_ID="uuid-do-departamento"
TEACHER_ID="uuid-do-professor"
COORDINATOR_ID="uuid-do-coordenador"
```

## 1. Listar Departamentos (com filtro por coordenador)

```bash
# Listar todos os departamentos
curl -X GET "${BASE_URL}/departments" \
  -H "Authorization: Bearer ${TOKEN}"

# Listar departamentos de um coordenador específico
curl -X GET "${BASE_URL}/departments?coordinatorId=${COORDINATOR_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 2. Listar Professores de um Departamento

```bash
curl -X GET "${BASE_URL}/departments/${DEPARTMENT_ID}/teachers" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Resposta esperada:**
```json
[
  {
    "id": "uuid",
    "name": "Ana Silva",
    "email": "ana@escola.com",
    "usuario": "ana.silva",
    "telefone": "11999999999",
    "cpf": "12345678901",
    "roles": [
      {
        "id": "uuid",
        "name": "teacher"
      }
    ]
  }
]
```

## 3. Adicionar Professores a um Departamento

```bash
curl -X POST "${BASE_URL}/departments/${DEPARTMENT_ID}/teachers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": [
      "uuid-professor-1",
      "uuid-professor-2"
    ]
  }'
```

**Validações:**
- Todos os usuários devem existir
- Todos os usuários devem possuir a role "teacher"
- Não permite duplicação (professores já vinculados são ignorados)

**Resposta esperada:**
```json
{
  "id": "uuid",
  "name": "Departamento de Matemática",
  "coordinator": { ... },
  "teachers": [
    {
      "id": "uuid-professor-1",
      "name": "Ana Silva",
      "email": "ana@escola.com"
    },
    {
      "id": "uuid-professor-2",
      "name": "Carlos Santos",
      "email": "carlos@escola.com"
    }
  ]
}
```

## 4. Remover Professor de um Departamento

```bash
curl -X DELETE "${BASE_URL}/departments/${DEPARTMENT_ID}/teachers/${TEACHER_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Resposta esperada:** Status 204 (No Content)

## 5. Listar Departamentos de um Professor

```bash
curl -X GET "${BASE_URL}/users/${TEACHER_ID}/departments" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Resposta esperada:**
```json
[
  {
    "id": "uuid",
    "name": "Departamento de Matemática",
    "coordinator": {
      "id": "uuid",
      "name": "João Coordenador",
      "email": "joao@escola.com"
    }
  }
]
```

## Exemplos de Erros

### Erro: Usuário não possui role "teacher"
```bash
curl -X POST "${BASE_URL}/departments/${DEPARTMENT_ID}/teachers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["uuid-usuario-sem-role-teacher"]
  }'
```

**Resposta esperada (400):**
```json
{
  "statusCode": 400,
  "message": "Os seguintes usuários não possuem a role 'teacher': Nome do Usuário"
}
```

### Erro: Professor já vinculado
```bash
# Tentar adicionar o mesmo professor novamente
curl -X POST "${BASE_URL}/departments/${DEPARTMENT_ID}/teachers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["uuid-professor-ja-vinculado"]
  }'
```

**Resposta esperada (409):**
```json
{
  "statusCode": 409,
  "message": "Todos os professores informados já estão vinculados a este departamento."
}
```

### Erro: Departamento não encontrado
```bash
curl -X GET "${BASE_URL}/departments/uuid-inexistente/teachers" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Resposta esperada (404):**
```json
{
  "statusCode": 404,
  "message": "Departamento com o ID 'uuid-inexistente' não encontrado."
}
```


