import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureDepartmentTeachersTable();
  }

  private async ensureDepartmentTeachersTable() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // Verificar se a tabela já existe
      const tableExists = await queryRunner.hasTable('department_teachers');

      if (tableExists) {
        this.logger.log('✅ Tabela department_teachers já existe');
        await queryRunner.release();
        return;
      }

      this.logger.log('🔧 Criando tabela department_teachers...');

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
        CREATE INDEX IF NOT EXISTS idx_department_teachers_department_id 
        ON department_teachers(department_id);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_department_teachers_user_id 
        ON department_teachers(user_id);
      `);

      this.logger.log('✅ Tabela department_teachers criada com sucesso!');
      await queryRunner.release();
    } catch (error) {
      this.logger.error('❌ Erro ao criar tabela department_teachers:', error);
      // Não lançar erro para não impedir a inicialização do app
    }
  }
}


