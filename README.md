# Sistema de Gestão Acadêmica (AVA e SGE Backend)

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-E0234E?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Backend de um sistema de ensino e gestão para faculdades (Ambiente Virtual de Aprendizagem - AVA), desenvolvido com NestJS, TypeORM e PostgreSQL.

## 🚧 Status do Projeto

**Em Desenvolvimento.** Este é um projeto em andamento. Novas funcionalidades estão sendo adicionadas e a estrutura pode mudar.

---

## Tecnologias Utilizadas

*   **Backend:** [NestJS](https://nestjs.com/)
*   **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
*   **ORM:** [TypeORM](https://typeorm.io/)
*   **Containerização:** [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
*   **Validação:** `class-validator` e `class-transformer`
*   **Autenticação:** JWT (JSON Web Tokens) - *a ser implementado*

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina:
*   [Node.js](https://nodejs.org/en/) (v18 ou superior)
*   [Docker](https://www.docker.com/products/docker-desktop)
*   Um gerenciador de pacotes como [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)

### 1. Clonar o Repositório

```bash
git clone https://github.com/otaviocostao/ava-backend.git
cd ava-backend
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com base no modelo abaixo
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
e preencha os campos de `DB_USERNAME`, `DB_PASSWORD`, `POSTGRES_USER` e `POSTGRES_PASSWORD`.

### 3. Iniciar o Banco de Dados

Com o Docker em execução, inicie o contêiner do PostgreSQL com o Docker Compose.

```bash
docker-compose up -d
```
O banco de dados estará disponível em `localhost:5432`.

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

---

## 📜 Scripts Disponíveis

*   `npm run start`: Inicia a aplicação em modo de produção.
*   `npm run start:dev`: Inicia a aplicação em modo de desenvolvimento.
*   `npm run build`: Compila o código TypeScript para JavaScript.
*   `npm run test`: Roda os testes unitários.

---
