/**
 * Script para criar a tabela department_teachers no banco de dados
 * Execute: npx ts-node scripts/create-department-teachers.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
config();

async function createDepartmentTeachersTable() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL
      ? { rejectUnauthorized: false }
      : undefined,
    synchronize: false, // Não usar synchronize aqui
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Verificar se a tabela já existe
    const tableExists = await queryRunner.hasTable('department_teachers');
    
    if (tableExists) {
      console.log('⚠️  A tabela department_teachers já existe');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    // Criar a tabela
    await queryRunner.query(`
      CREATE TABLE department_teachers (
        department_id UUID NOT NULL,
        user_id UUID NOT NULL,
        PRIMARY KEY (department_id, user_id),
        CONSTRAINT fk_department_teachers_department 
          FOREIGN KEY (department_id) 
          REFERENCES departments(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE,
        CONSTRAINT fk_department_teachers_user 
          FOREIGN KEY (user_id) 
          REFERENCES users(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE
      );
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX idx_department_teachers_department_id 
      ON department_teachers(department_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_department_teachers_user_id 
      ON department_teachers(user_id);
    `);

    console.log('✅ Tabela department_teachers criada com sucesso!');
    console.log('✅ Índices criados com sucesso!');

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

createDepartmentTeachersTable();


