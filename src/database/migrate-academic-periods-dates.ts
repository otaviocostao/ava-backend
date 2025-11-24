import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';
import { AcademicPeriod } from '../academic-periods/entities/academic-period.entity';

/**
 * Calcula as datas de início e fim de um período acadêmico
 * Formato do período: YYYY.1 (semestre 1) ou YYYY.2 (semestre 2)
 * 
 * Semestre 1: Janeiro a Junho
 * Semestre 2: Julho a Dezembro
 */
function calculatePeriodDates(period: string): { startDate: Date; endDate: Date } {
  const [year, semester] = period.split('.');
  const yearNum = parseInt(year, 10);
  const semesterNum = parseInt(semester, 10);

  let startDate: Date;
  let endDate: Date;

  if (semesterNum === 1) {
    // Semestre 1: Janeiro a Junho
    startDate = new Date(yearNum, 0, 1); // 1 de Janeiro
    endDate = new Date(yearNum, 5, 30); // 30 de Junho
  } else if (semesterNum === 2) {
    // Semestre 2: Julho a Dezembro
    startDate = new Date(yearNum, 6, 1); // 1 de Julho
    endDate = new Date(yearNum, 11, 31); // 31 de Dezembro
  } else {
    throw new Error(`Formato de período inválido: ${period}. Esperado formato YYYY.1 ou YYYY.2`);
  }

  // Ajustar para UTC (meio-dia para evitar problemas de timezone)
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);

  return { startDate, endDate };
}

async function migrateAcademicPeriodsDates() {
  console.log('🔄 Iniciando migração de datas dos períodos letivos...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const academicPeriodRepository = dataSource.getRepository(AcademicPeriod);

    // Buscar todos os períodos acadêmicos
    const allPeriods = await academicPeriodRepository.find();

    if (allPeriods.length === 0) {
      console.log('⚠️  Nenhum período acadêmico encontrado. Execute primeiro a migração de períodos.');
      return;
    }

    console.log(`📅 Encontrados ${allPeriods.length} períodos acadêmicos`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const period of allPeriods) {
      // Verificar se já tem datas definidas
      if (period.startDate && period.endDate) {
        console.log(`   ⏭️  Período ${period.period} já possui datas (${period.startDate.toISOString().split('T')[0]} - ${period.endDate.toISOString().split('T')[0]})`);
        skippedCount++;
        continue;
      }

      try {
        const { startDate, endDate } = calculatePeriodDates(period.period);

        period.startDate = startDate;
        period.endDate = endDate;

        await academicPeriodRepository.save(period);
        console.log(`   ✅ Período ${period.period}: ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`);
        updatedCount++;
      } catch (error) {
        console.log(`   ❌ Erro ao processar período ${period.period}:`, error.message);
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Atualizados: ${updatedCount}`);
    console.log(`   ⏭️  Ignorados (já possuem datas): ${skippedCount}`);

    // Verificar se ainda há períodos sem datas
    const periodsWithoutDates = await academicPeriodRepository
      .createQueryBuilder('ap')
      .where('ap.start_date IS NULL OR ap.end_date IS NULL')
      .getCount();

    if (periodsWithoutDates > 0) {
      console.log(`\n⚠️  Ainda há ${periodsWithoutDates} períodos sem datas. Não é possível tornar colunas NOT NULL.`);
    } else {
      // Tornar colunas NOT NULL após migração completa
      console.log('\n🔒 Tornando colunas NOT NULL...');
      try {
        await dataSource.query(`
          ALTER TABLE academic_periods 
          ALTER COLUMN start_date SET NOT NULL;
        `);
        console.log('   ✅ academic_periods.start_date agora é NOT NULL');

        await dataSource.query(`
          ALTER TABLE academic_periods 
          ALTER COLUMN end_date SET NOT NULL;
        `);
        console.log('   ✅ academic_periods.end_date agora é NOT NULL');
      } catch (error) {
        console.log('   ⚠️  Erro ao tornar colunas NOT NULL:', error.message);
        console.log('   💡 Certifique-se de que todos os períodos possuem datas antes de executar novamente.');
      }
    }

    console.log('\n✅ Migração de datas concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateAcademicPeriodsDates()
    .then(() => {
      console.log('🎉 Migração finalizada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal na migração:', error);
      process.exit(1);
    });
}

export { migrateAcademicPeriodsDates };

