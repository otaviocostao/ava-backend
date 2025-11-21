import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureDepartmentTeachersTable();
    await this.ensureVideoLessonsOrderColumn();
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

  private async ensureVideoLessonsOrderColumn() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // Verificar se a coluna já existe
      const table = await queryRunner.getTable('video_lessons');
      const orderColumn = table?.findColumnByName('order');

      if (!orderColumn) {
        this.logger.log('🔧 Adicionando coluna order na tabela video_lessons...');
        
        // Adicionar coluna order
        await queryRunner.query(`
          ALTER TABLE video_lessons 
          ADD COLUMN IF NOT EXISTS "order" INTEGER;
        `);

        // Criar índice composto
        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS idx_video_lessons_discipline_order 
          ON video_lessons(discipline_id, "order");
        `);

        this.logger.log('✅ Coluna order adicionada com sucesso!');
      }

      // Atualizar registros existentes que não têm order definido
      // Atribuir ordem sequencial baseada em created_at por disciplina
      await queryRunner.query(`
        WITH ordered_video_lessons AS (
          SELECT 
            id,
            discipline_id,
            ROW_NUMBER() OVER (PARTITION BY discipline_id ORDER BY created_at ASC) as new_order
          FROM video_lessons
          WHERE "order" IS NULL AND deleted_at IS NULL
        )
        UPDATE video_lessons vl
        SET "order" = ovl.new_order
        FROM ordered_video_lessons ovl
        WHERE vl.id = ovl.id;
      `);

      this.logger.log('✅ Ordem das vídeo-aulas atualizada para registros existentes!');
      await queryRunner.release();
    } catch (error) {
      this.logger.error('❌ Erro ao garantir coluna order em video_lessons:', error);
      // Não lançar erro para não impedir a inicialização do app
    }
  }
}



