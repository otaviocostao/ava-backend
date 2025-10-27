# Sistema de Gestão Acadêmica (AVA e SGE Backend)

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-E0234E?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Backend de um sistema de ensino e gestão para faculdades (Ambiente Virtual de Aprendizagem - AVA), desenvolvido com NestJS, TypeORM e PostgreSQL/Supabase.

## 🎯 Qual Opção Escolher?

| Aspecto | PostgreSQL Local | Supabase |
|---------|------------------|----------|
| **Facilidade** | 🔴 Mais complexo | ✅ **Mais fácil** |
| **Setup** | Docker + Config | Só configurar URL |
| **Backup** | Manual | ✅ Automático |
| **Interface** | Linha de comando | ✅ Web interface |
| **Custo** | Gratuito | ✅ Gratuito |
| **Recomendado** | Para produção | **✅ Para desenvolvimento** |

> 💡 **Recomendação:** Use **Supabase** para desenvolvimento - é mais rápido de configurar e você pode ver os dados diretamente no navegador!

## 🚧 Status do Projeto

**Em Desenvolvimento.** Este é um projeto em andamento. Novas funcionalidades estão sendo adicionadas e a estrutura pode mudar.

---

## Tecnologias Utilizadas

*   **Backend:** [NestJS](https://nestjs.com/)
*   **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) ou [Supabase](https://supabase.com/)
*   **ORM:** [TypeORM](https://typeorm.io/)
*   **Containerização:** [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
*   **Validação:** `class-validator` e `class-transformer`
*   **Documentação:** [Swagger](https://swagger.io/)
*   **Autenticação:** JWT (JSON Web Tokens) - *a ser implementado*

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina:
*   [Node.js](https://nodejs.org/en/) (v18 ou superior)
*   Um gerenciador de pacotes como [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)

**Para PostgreSQL Local (Opção A):**
*   [Docker](https://www.docker.com/products/docker-desktop)

**Para Supabase (Opção B):**
*   ✅ **Nenhuma instalação adicional necessária!**
*   Apenas uma conta gratuita no [Supabase](https://supabase.com)

### 1. Clonar o Repositório

```bash
git clone https://github.com/otaviocostao/ava-backend.git
cd ava-backend
```

### 2. Configurar Variáveis de Ambiente

Você pode usar **PostgreSQL local** (via Docker) ou **Supabase** como banco de dados.

#### **Opção A: PostgreSQL Local (via Docker)**

Crie um arquivo `.env` na raiz do projeto com base no modelo abaixo:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=ava_db

POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=ava_db
POSTGRES_PORT=5432
```

E preencha os campos de `DB_USERNAME`, `DB_PASSWORD`, `POSTGRES_USER` e `POSTGRES_PASSWORD`.

#### **Opção B: Supabase (Recomendada para desenvolvimento)**

1. **Crie um projeto no [Supabase](https://supabase.com)**

2. **Obtenha a string de conexão:**
   - Acesse seu projeto no Supabase
   - Vá para **Table Editor** → **Connect** → **Session Mode**
   - Copie a string de conexão

3. **Crie o arquivo `.env`:**
   ```bash
   # Para Linux/Mac:
   cp .env.example .env

   # Para Windows (PowerShell):
   # Copie o conteúdo do arquivo env-example.txt para .env
   # Ou crie manualmente:
   echo "DATABASE_URL=postgresql://postgres.[SEU_ID]:[SUA_SENHA]@aws-0-regiao.pooler.supabase.com:6543/postgres" > .env
   ```

4. **Configure a DATABASE_URL:**
   ```
   DATABASE_URL=postgresql://postgres.[SEU_ID_PROJETO]:[SUA_SENHA]@aws-0-regiao.pooler.supabase.com:6543/postgres
   ```

   Substitua:
   - `[SEU_ID_PROJETO]` pelo ID do seu projeto no Supabase
   - `[SUA_SENHA]` pela senha do seu banco de dados

**💡 Vantagens do Supabase:**
- ✅ Não precisa instalar PostgreSQL localmente
- ✅ Backup automático
- ✅ Interface web para visualizar dados
- ✅ Connection Pooler compatível com IPv4
- ✅ SSL configurado automaticamente

### 🔄 Configuração Automática

O sistema detecta automaticamente qual configuração usar:

- **Se `DATABASE_URL` estiver definida** → Usa Supabase
- **Se `DATABASE_URL` não estiver definida** → Usa PostgreSQL local com as variáveis separadas

**Você pode alternar entre as opções a qualquer momento editando apenas o arquivo `.env`!**

### 3. Iniciar o Banco de Dados

**PostgreSQL Local (Opção A):**
- Certifique-se de que o Docker está em execução
- Inicie o contêiner do PostgreSQL:

```bash
docker-compose up -d
```
O banco de dados estará disponível em `localhost:5432`.

**Supabase (Opção B):**
- ✅ **Não precisa instalar nem iniciar nada!**
- O Supabase já está rodando na nuvem
- Apenas configure a `DATABASE_URL` no arquivo `.env`

> 💡 **Verifique qual configuração está ativa** nos logs quando iniciar a aplicação.

### 4. Instalar as Dependências do Projeto

```bash
npm install
```
ou
```bash
yarn install
```

### 5. Rodar a Aplicação

Para iniciar o servidor em modo de desenvolvimento (com hot-reload):

```bash
npm run start:dev
```

A aplicação estará disponível em `http://localhost:3000`.

### 6. Acessar a Documentação e Testar

#### **Swagger UI (Documentação Interativa)**
Acesse `http://localhost:3000/api` para:
- 📖 Ver todos os endpoints disponíveis
- 🧪 Testar as APIs diretamente pelo navegador
- 📋 Visualizar os schemas de request/response

#### **Scripts de Teste**
Foram criados scripts para testar a integração:

```bash
# Teste completo da API (recomendado)
node test-api.js

**Os scripts testam:**
- ✅ Criação de roles e usuários
- ✅ Listagem e busca de dados
- ✅ Relacionamentos entre entidades
- ✅ Integração com o banco de dados

---

### 7. Endpoints do Projeto

Para explorar os endpoints disponíveis:

1. Inicie a aplicação com `npm run start:dev`
2. Acesse `http://localhost:3000/api` no navegador
3. Use o botão **Try it out** para testar as requisições
4. Veja todos os endpoints organizados por módulos:
   - 👥 **Users** - Gerenciamento de usuários
   - 🏷️ **Roles** - Perfis e permissões
   - 📚 **Courses** - Cursos oferecidos
   - 🏢 **Departments** - Departamentos
   - 📖 **Disciplines** - Disciplinas
   - 👨‍🏫 **Classes** - Turmas e aulas
   - 📝 **Enrollments** - Matrículas
   - 📊 **Grades** - Notas e avaliações
   - 📢 **News** - Notícias e avisos
   - 📋 **Activities** - Atividades
   - 📁 **Materials** - Materiais didáticos
   - 📅 **Schedules** - Horários e cronogramas

### 🚀 Exemplo Rápido de Uso

Para explorar os endpoints disponiveis:

Inicie a aplicacao com `npm run start:dev` (ou comando equivalente).
Acesse `http://localhost:3000/api` no navegador para abrir a documentacao interativa (Swagger UI).
Utilize o botao **Try it out** para testar as requisicoes diretamente pela interface.


## 📜 Scripts Disponíveis

*   `npm run start`: Inicia a aplicação em modo de produção.
*   `npm run start:dev`: Inicia a aplicação em modo de desenvolvimento.
*   `npm run build`: Compila o código TypeScript para JavaScript.
*   `npm run test`: Roda os testes unitários.

---
