# 🌱 Database Scripts - AVA Backend

Este documento contém informações sobre os scripts de banco de dados do sistema AVA.

## 📋 Scripts Disponíveis

### 1. **Inicialização Básica**
```bash
npm run init
```
**O que faz**: Cria apenas roles e usuário admin
**Quando usar**: Primeira execução ou sistema limpo
**Cria**:
- 3 roles (admin, teacher, student)
- 1 usuário admin (admin@ava.com)

### 2. **Seed Completo**
```bash
npm run seed
```
**O que faz**: Cria todos os dados de teste
**Quando usar**: Desenvolvimento e testes
**Pré-requisito**: Execute primeiro `npm run init`
**Cria**:
- 4 cursos e 10 disciplinas
- 6 usuários (3 professores, 3 estudantes)
- 5 turmas com conteúdo completo
- 11 disponibilidades dos professores

## 🚀 Fluxo de Trabalho Recomendado

### 🆕 **Instalação**
```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco de dados
# (configurar .env com dados do banco)

# 3. Inicializar sistema
npm run init

# 4. Para desenvolvimento, adicionar dados de teste
npm run seed
```

### 🚀 **Produção**
```bash
# Apenas inicialização básica
npm run init

# Criar dados reais via API ou painel administrativo
```

## 🔧 Configuração

### Variável de Ambiente

- Use a variável `INITIAL_ADMIN_PASSWORD` no `.env` para definir a senha do admin


### ⚠️ **Importante sobre Segurança**
- A senha padrão é `123456` (apenas para desenvolvimento)
- **SEMPRE** altere a senha em produção

## 📊 Dados Criados pelo Seed

### 👥 Usuários
- **Professores**: 
  - Prof. João Silva (joao.silva@ava.com)
  - Prof. Maria Santos (maria.santos@ava.com) 
  - Prof. Pedro Costa (pedro.costa@ava.com)
- **Estudantes**:
  - Ana Oliveira (ana.oliveira@ava.com)
  - Carlos Mendes (carlos.mendes@ava.com)
  - Fernanda Lima (fernanda.lima@ava.com)

### 🎓 Cursos e Disciplinas
- **Ciência da Computação**: Programação I, Estruturas de Dados, Algoritmos, Banco de Dados
- **Engenharia de Software**: Desenvolvimento Web, Arquitetura de Software, Engenharia de Requisitos
- **Sistemas de Informação**: Gestão de Projetos, Sistemas Operacionais
- **ADS**: Redes de Computadores

### 🏫 Turmas
- 5 turmas distribuídas entre os professores
- Semestres 2024.1 e 2024.2
- Códigos únicos para identificação

### 📝 Conteúdo das Turmas
Para cada turma são criados:
- **Atividades**: Exercícios, provas e projetos
- **Materiais**: Slides, exercícios resolvidos, tutoriais
- **Horários**: Grade horária com dias e horários específicos
- **Fóruns**: Espaços para discussão
- **Planos de Aula**: Conteúdo das aulas

### 📅 Disponibilidades
- Disponibilidades dos professores por semestre
- Horários específicos por dia da semana
- Dados para testar filtros por professor, semestre e dia

## 🆘 Troubleshooting

### Erro de Conexão
- Verificar se banco está rodando
- Confirmar configurações no `.env`

### Erro de Permissão
- Verificar permissões do usuário do banco
- Confirmar se tabelas podem ser criadas

### Erro "Role não encontrada"
- Execute primeiro `npm run init` antes de `npm run seed`
- O seed depende das roles criadas pelo init

### Dados Duplicados
- Scripts detectam automaticamente dados existentes
- Não criam duplicatas
- Use `npm run seed` para dados completos

## 📁 Arquivos de Script

| Arquivo | Descrição |
|---------|-----------|
| `src/database/init.ts` | Inicialização básica |
| `src/database/seed.ts` | Dados completos de teste |

## 🎯 Resumo Rápido

| Comando | Uso | Resultado |
|---------|-----|-----------|
| `npm run init` | Sistema limpo | Roles + Admin |
| `npm run seed` | Desenvolvimento | Dados completos |

**Recomendação**: Execute `npm run init` primeiro, depois `npm run seed`! 🚀