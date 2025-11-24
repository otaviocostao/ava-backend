import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';
import { AcademicPeriod } from '../academic-periods/entities/academic-period.entity';
import { StudentCourse } from '../student-courses/entities/student-course.entity';
import { Availability } from '../availabilities/entities/availability.entity';
import { Class } from '../classes/entities/class.entity';

async function migrateAcademicPeriods() {
  console.log('🔄 Iniciando migração de períodos letivos...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const academicPeriodRepository = dataSource.getRepository(AcademicPeriod);
    const studentCourseRepository = dataSource.getRepository(StudentCourse);
    const availabilityRepository = dataSource.getRepository(Availability);
    const classRepository = dataSource.getRepository(Class);

    // 1. Descobrir períodos únicos dos dados existentes e criar períodos letivos
    console.log('📅 Descobrindo períodos letivos dos dados existentes...');
    
    // Buscar todos os períodos únicos das tabelas
    const studentCoursePeriods = await dataSource.query(`
      SELECT DISTINCT entry_semester 
      FROM student_courses 
      WHERE entry_semester IS NOT NULL
    `);
    
    const availabilityPeriods = await dataSource.query(`
      SELECT DISTINCT semester 
      FROM availabities 
      WHERE semester IS NOT NULL
    `);
    
    const classPeriods = await dataSource.query(`
      SELECT DISTINCT semester 
      FROM classes 
      WHERE semester IS NOT NULL
    `);
    
    // Coletar todos os períodos únicos e normalizar formato
    const uniquePeriods = new Set<string>();
    
    [...studentCoursePeriods, ...availabilityPeriods, ...classPeriods].forEach(row => {
      const periodStr = row.entry_semester || row.semester;
      if (periodStr) {
        // Normalizar formato: YYYY-1 ou YYYY-2 -> YYYY.1 ou YYYY.2
        const normalized = periodStr.replace('-', '.');
        uniquePeriods.add(normalized);
      }
    });
    
    // Garantir períodos padrão também
    ['2024.1', '2024.2', '2025.1', '2025.2', '2026.1', '2026.2'].forEach(p => uniquePeriods.add(p));
    
    console.log(`   📋 Períodos encontrados: ${Array.from(uniquePeriods).sort().join(', ')}`);
    
    const periodMap = new Map<string, AcademicPeriod>();

    for (const periodStr of Array.from(uniquePeriods).sort()) {
      let period = await academicPeriodRepository.findOne({
        where: { period: periodStr },
      });

      if (!period) {
        period = academicPeriodRepository.create({ period: periodStr });
        period = await academicPeriodRepository.save(period);
        console.log(`   ✅ Período criado: ${periodStr}`);
      } else {
        console.log(`   ⏭️  Período já existe: ${periodStr}`);
      }

      periodMap.set(periodStr, period);
    }

    // 2. Migrar student_courses
    console.log('🔄 Migrando student_courses...');
    const allStudentCourses = await studentCourseRepository
      .createQueryBuilder('sc')
      .where('sc.entry_academic_period_id IS NULL')
      .getMany();

    let migratedCount = 0;
    for (const studentCourse of allStudentCourses) {
      // Buscar entry_semester usando query raw se necessário
      const rawData = await dataSource.query(
        `SELECT entry_semester FROM student_courses WHERE id = $1`,
        [studentCourse.id]
      );

      const entrySemester = rawData[0]?.entry_semester || studentCourse.entrySemester;

      if (entrySemester) {
        // Converter formato YYYY-1 ou YYYY-2 para YYYY.1 ou YYYY.2
        const normalizedPeriod = entrySemester.replace('-', '.');
        const period = periodMap.get(normalizedPeriod);

        if (period) {
          studentCourse.entryAcademicPeriod = period;
          await studentCourseRepository.save(studentCourse);
          migratedCount++;
        } else {
          console.log(`   ⚠️  Período não encontrado para student_course ${studentCourse.id}: ${entrySemester} (normalizado: ${normalizedPeriod})`);
          // Tentar criar o período se não existir
          try {
            const newPeriod = academicPeriodRepository.create({ period: normalizedPeriod });
            const savedPeriod = await academicPeriodRepository.save(newPeriod);
            periodMap.set(normalizedPeriod, savedPeriod);
            studentCourse.entryAcademicPeriod = savedPeriod;
            await studentCourseRepository.save(studentCourse);
            migratedCount++;
            console.log(`   ✅ Período ${normalizedPeriod} criado e student_course migrado`);
          } catch (err) {
            console.log(`   ❌ Erro ao criar período ${normalizedPeriod}:`, err.message);
          }
        }
      }
    }
    console.log(`   ✅ ${migratedCount} registros de student_courses migrados`);

    // 3. Migrar availabilities
    console.log('🔄 Migrando availabilities...');
    const allAvailabilities = await availabilityRepository
      .createQueryBuilder('a')
      .where('a.academic_period_id IS NULL')
      .getMany();

    migratedCount = 0;
    for (const availability of allAvailabilities) {
      // Buscar semester usando query raw se necessário
      const rawData = await dataSource.query(
        `SELECT semester FROM availabities WHERE id = $1`,
        [availability.id]
      );

      const semester = rawData[0]?.semester || availability.semester;

      if (semester) {
        // Normalizar formato (pode ser YYYY.1, YYYY-1, etc)
        const normalizedPeriod = semester.replace('-', '.');
        const period = periodMap.get(normalizedPeriod);

        if (period) {
          availability.academicPeriod = period;
          await availabilityRepository.save(availability);
          migratedCount++;
        } else {
          console.log(`   ⚠️  Período não encontrado para availability ${availability.id}: ${semester} (normalizado: ${normalizedPeriod})`);
          // Tentar criar o período se não existir
          try {
            const newPeriod = academicPeriodRepository.create({ period: normalizedPeriod });
            const savedPeriod = await academicPeriodRepository.save(newPeriod);
            periodMap.set(normalizedPeriod, savedPeriod);
            availability.academicPeriod = savedPeriod;
            await availabilityRepository.save(availability);
            migratedCount++;
            console.log(`   ✅ Período ${normalizedPeriod} criado e availability migrado`);
          } catch (err) {
            console.log(`   ❌ Erro ao criar período ${normalizedPeriod}:`, err.message);
          }
        }
      }
    }
    console.log(`   ✅ ${migratedCount} registros de availabilities migrados`);

    // 4. Migrar classes
    console.log('🔄 Migrando classes...');
    const allClasses = await classRepository
      .createQueryBuilder('c')
      .where('c.academic_period_id IS NULL')
      .getMany();

    migratedCount = 0;
    for (const classEntity of allClasses) {
      // Buscar semester usando query raw (pode ainda existir no banco de dados antigo)
      const rawData = await dataSource.query(
        `SELECT semester FROM classes WHERE id = $1`,
        [classEntity.id]
      );

      const semester = rawData[0]?.semester;

      if (semester) {
        // Normalizar formato (pode ser YYYY.1, YYYY-1, etc)
        const normalizedPeriod = semester.replace('-', '.');
        const period = periodMap.get(normalizedPeriod);

        if (period) {
          classEntity.academicPeriod = period;
          await classRepository.save(classEntity);
          migratedCount++;
        } else {
          console.log(`   ⚠️  Período não encontrado para class ${classEntity.id}: ${semester} (normalizado: ${normalizedPeriod})`);
          // Tentar criar o período se não existir
          try {
            const newPeriod = academicPeriodRepository.create({ period: normalizedPeriod });
            const savedPeriod = await academicPeriodRepository.save(newPeriod);
            periodMap.set(normalizedPeriod, savedPeriod);
            classEntity.academicPeriod = savedPeriod;
            await classRepository.save(classEntity);
            migratedCount++;
            console.log(`   ✅ Período ${normalizedPeriod} criado e class migrado`);
          } catch (err) {
            console.log(`   ❌ Erro ao criar período ${normalizedPeriod}:`, err.message);
          }
        }
      }
    }
    console.log(`   ✅ ${migratedCount} registros de classes migrados`);

    // 5. Verificar se ainda há registros com NULL antes de tornar NOT NULL
    console.log('🔍 Verificando registros pendentes...');
    const remainingNulls = {
      studentCourses: await dataSource.query(`
        SELECT COUNT(*) as count FROM student_courses WHERE entry_academic_period_id IS NULL
      `),
      availabilities: await dataSource.query(`
        SELECT COUNT(*) as count FROM availabities WHERE academic_period_id IS NULL
      `),
      classes: await dataSource.query(`
        SELECT COUNT(*) as count FROM classes WHERE academic_period_id IS NULL
      `),
    };

    const studentCoursesNull = parseInt(remainingNulls.studentCourses[0]?.count || '0');
    const availabilitiesNull = parseInt(remainingNulls.availabilities[0]?.count || '0');
    const classesNull = parseInt(remainingNulls.classes[0]?.count || '0');

    if (studentCoursesNull > 0 || availabilitiesNull > 0 || classesNull > 0) {
      console.log(`   ⚠️  Ainda há registros com NULL:`);
      console.log(`      - student_courses: ${studentCoursesNull}`);
      console.log(`      - availabilities: ${availabilitiesNull}`);
      console.log(`      - classes: ${classesNull}`);
      console.log(`   ⚠️  Não é possível tornar colunas NOT NULL. Execute a migração novamente.`);
    } else {
      // 6. Tornar colunas NOT NULL após migração completa
      console.log('🔒 Tornando colunas NOT NULL...');
      try {
        await dataSource.query(`
          ALTER TABLE student_courses 
          ALTER COLUMN entry_academic_period_id SET NOT NULL;
        `);
        console.log('   ✅ student_courses.entry_academic_period_id agora é NOT NULL');

        await dataSource.query(`
          ALTER TABLE availabities 
          ALTER COLUMN academic_period_id SET NOT NULL;
        `);
        console.log('   ✅ availabities.academic_period_id agora é NOT NULL');

        await dataSource.query(`
          ALTER TABLE classes 
          ALTER COLUMN academic_period_id SET NOT NULL;
        `);
        console.log('   ✅ classes.academic_period_id agora é NOT NULL');
      } catch (error) {
        console.log('   ⚠️  Erro ao tornar colunas NOT NULL:', error.message);
      }
    }

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateAcademicPeriods()
    .then(() => {
      console.log('🎉 Migração finalizada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal na migração:', error);
      process.exit(1);
    });
}

export { migrateAcademicPeriods };

