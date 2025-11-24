# Database Migrations

Este diretório contém scripts SQL para atualizações manuais do banco de dados.

## Scripts Disponíveis

### add-virtual-exam-enum.sql

Adiciona o valor `virtual_exam` ao enum `activities_type_enum` no PostgreSQL.

**Como executar:**

1. **Via psql (linha de comando):**
   ```bash
   psql -U seu_usuario -d seu_database -f database/migrations/add-virtual-exam-enum.sql
   ```

2. **Via pgAdmin ou outra ferramenta gráfica:**
   - Abra o arquivo `add-virtual-exam-enum.sql`
   - Execute o conteúdo no banco de dados

3. **Via conexão direta:**
   ```sql
   -- Conecte-se ao banco e execute:
   DO $$
   BEGIN
       IF NOT EXISTS (
           SELECT 1 
           FROM pg_enum 
           WHERE enumlabel = 'virtual_exam' 
           AND enumtypid = (
               SELECT oid 
               FROM pg_type 
               WHERE typname = 'activities_type_enum'
           )
       ) THEN
           ALTER TYPE activities_type_enum ADD VALUE 'virtual_exam';
       END IF;
   END $$;
   ```

**Nota:** Este script é idempotente - pode ser executado múltiplas vezes sem causar erros.



