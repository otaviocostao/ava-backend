# Guia de Teste - Módulo Financeiro

## Como Funciona o Sistema de Pagamentos

O sistema de pagamentos é **simulado** - não há integração com gateway de pagamento ainda. O fluxo funciona assim:

1. **Criar Lançamento**: Cria uma parcela/mensalidade para um aluno (status: `pending`)
2. **Simular Pagamento**: Atualiza o status para `paid` manualmente
3. **Visualizar**: Usa os endpoints do módulo financeiro para ver dados

## Passo a Passo para Testar

### 1. Pré-requisitos

- Ter um aluno cadastrado no sistema
- Obter o token JWT (fazer login)
- Ter o ID do aluno

### 2. Criar Pagamentos (Lançamentos Financeiros)

**Endpoint**: `POST /payments`

**Body**:
```json
{
  "studentId": "uuid-do-aluno",
  "amount": 500.00,
  "dueDate": "2024-03-15"
}
```

**Exemplo com cURL**:
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "studentId": "uuid-do-aluno",
    "amount": 500.00,
    "dueDate": "2024-03-15"
  }'
```

**Resposta**: Retorna o pagamento criado com status `pending`

### 3. Criar Múltiplas Parcelas (Mensalidades)

Para criar 12 mensalidades de R$ 500,00:

```bash
# Janeiro 2024
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"studentId": "uuid", "amount": 500.00, "dueDate": "2024-01-15"}'

# Fevereiro 2024
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"studentId": "uuid", "amount": 500.00, "dueDate": "2024-02-15"}'

# ... e assim por diante
```

**Dica**: Você pode criar um script para gerar todas as parcelas de uma vez.

### 4. Simular Pagamento (Marcar como Pago)

**Endpoint**: `PATCH /payments/:id`

**Body**:
```json
{
  "status": "paid"
}
```

**Exemplo**:
```bash
curl -X PATCH http://localhost:3000/payments/uuid-do-pagamento \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"status": "paid"}'
```

**O que acontece**:
- Status muda para `paid`
- Campo `paidAt` é preenchido automaticamente com a data/hora atual

### 5. Criar Pagamento com Desconto e Categoria (Novo)

Agora você pode criar pagamentos com mais informações:

```json
{
  "studentId": "uuid-do-aluno",
  "amount": 500.00,
  "dueDate": "2024-03-15",
  "discount": 50.00,
  "category": "monthly_fee",
  "description": "Mensalidade Março 2024",
  "installmentNumber": 3,
  "totalInstallments": 12
}
```

**Nota**: Esses campos são opcionais no DTO atual. Você precisaria atualizar o `CreatePaymentDto` para aceitá-los, ou criar via banco de dados diretamente.

### 6. Testar Endpoints do Módulo Financeiro

#### 6.1 Resumo Financeiro do Aluno

```bash
curl -X GET "http://localhost:3000/financial/students/uuid-do-aluno/summary" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Com filtros**:
```bash
curl -X GET "http://localhost:3000/financial/students/uuid-do-aluno/summary?period=year&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### 6.2 Listar Parcelas do Aluno

```bash
curl -X GET "http://localhost:3000/financial/students/uuid-do-aluno/installments" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### 6.3 Histórico de Pagamentos

```bash
curl -X GET "http://localhost:3000/financial/students/uuid-do-aluno/payments" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Com filtros**:
```bash
curl -X GET "http://localhost:3000/financial/students/uuid-do-aluno/payments?status=paid&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### 6.4 Resumo Administrativo

```bash
curl -X GET "http://localhost:3000/financial/admin/summary?period=month" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

#### 6.5 Alunos Inadimplentes

```bash
curl -X GET "http://localhost:3000/financial/admin/defaulting-students" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

**Com filtros**:
```bash
curl -X GET "http://localhost:3000/financial/admin/defaulting-students?search=joao&minMonths=1&maxMonths=6" \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

### 7. Criar Despesas (Admin)

Para testar relatórios completos, você precisa criar despesas:

**Endpoint**: Não existe ainda! Você precisaria criar via banco de dados ou criar o endpoint.

**Via SQL** (exemplo):
```sql
INSERT INTO expenses (id, description, amount, category, expense_date, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Salário Professor',
  5000.00,
  'salaries',
  '2024-03-01',
  NOW(),
  NOW()
);
```

### 8. Testar Fluxo Completo

1. **Criar aluno** (se não tiver)
2. **Criar 3-4 pagamentos** com datas diferentes (alguns no passado, alguns no futuro)
3. **Marcar alguns como pagos** (status: `paid`)
4. **Deixar alguns pendentes** para testar inadimplência
5. **Testar endpoints do módulo financeiro**:
   - Resumo do aluno
   - Lista de parcelas
   - Histórico de pagamentos
   - Resumo administrativo
   - Alunos inadimplentes

### 9. Testar Status Automático (Overdue)

O sistema automaticamente marca pagamentos como `overdue` quando:
- A data de vencimento (`dueDate`) é anterior à data atual
- O status ainda é `pending`

**Para testar**:
1. Crie um pagamento com `dueDate` no passado (ex: "2024-01-01")
2. Chame qualquer endpoint que lista pagamentos
3. O sistema automaticamente atualiza o status para `overdue`

**Ou execute manualmente**:
```bash
curl -X POST "http://localhost:3000/payments/run-overdue-check" \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Exemplo Completo de Teste

### Script de Teste (Bash)

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
TOKEN="seu-token-jwt-aqui"
STUDENT_ID="uuid-do-aluno"

# 1. Criar pagamentos
echo "Criando pagamentos..."
curl -X POST "$BASE_URL/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"studentId\": \"$STUDENT_ID\", \"amount\": 500.00, \"dueDate\": \"2024-01-15\"}"

curl -X POST "$BASE_URL/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"studentId\": \"$STUDENT_ID\", \"amount\": 500.00, \"dueDate\": \"2024-02-15\"}"

# 2. Marcar primeiro como pago
PAYMENT_ID="uuid-do-primeiro-pagamento"
echo "Marcando pagamento como pago..."
curl -X PATCH "$BASE_URL/payments/$PAYMENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status": "paid"}'

# 3. Ver resumo
echo "Resumo financeiro:"
curl -X GET "$BASE_URL/financial/students/$STUDENT_ID/summary" \
  -H "Authorization: Bearer $TOKEN"

# 4. Ver parcelas
echo "Parcelas:"
curl -X GET "$BASE_URL/financial/students/$STUDENT_ID/installments" \
  -H "Authorization: Bearer $TOKEN"
```

## Usando Swagger

A forma mais fácil de testar é usando o Swagger UI:

1. Acesse: `http://localhost:3000/api`
2. Faça login em `/auth/login` para obter o token
3. Clique em "Authorize" e cole o token
4. Teste os endpoints:
   - `/payments` - Criar e gerenciar pagamentos
   - `/financial/students/:studentId/*` - Endpoints do aluno
   - `/financial/admin/*` - Endpoints do admin

## Notas Importantes

1. **Pagamentos são simulados**: Não há integração com gateway real
2. **Status automático**: Pagamentos vencidos são marcados como `overdue` automaticamente
3. **Campos novos**: Os novos campos (discount, method, category, etc) são opcionais e nullable
4. **Comprovantes**: Para testar download de comprovantes, você precisa fazer upload de um arquivo primeiro (funcionalidade futura)

## Próximos Passos

Para implementar pagamento real:
1. Integrar com gateway (ex: Stripe, Mercado Pago, PagSeguro)
2. Criar webhook para receber confirmações
3. Atualizar status automaticamente quando pagamento for confirmado
4. Gerar comprovantes automaticamente

