import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';
import { Course } from '../courses/entities/course.entity';
import { Discipline } from '../disciplines/entities/discipline.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Class } from '../classes/entities/class.entity';
import { Activity } from '../activities/entities/activity.entity';
import { Material } from '../materials/entities/material.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Forum } from '../forums/entities/forum.entity';
import { LessonPlan } from '../lesson-plans/entities/lesson-plan.entity';
import { Availability } from '../availabilities/entities/availability.entity';
import { AcademicPeriod } from '../academic-periods/entities/academic-period.entity';
import { ActivityType } from '../common/enums/activity-type.enum';
import { ActivityUnit } from '../common/enums/activity-unit.enum';
import { DayOfWeek } from '../common/enums/day-of-week.enum';
import { CourseStatus } from '../common/enums/course-status.enum';
import * as bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Limpar dados existentes (opcional - descomente se necessário)
    // await clearDatabase(dataSource);

    // Criar dados base
    const academicPeriods = await createAcademicPeriods(dataSource);
    const courses = await createCourses(dataSource);
    const disciplines = await createDisciplines(dataSource, courses);
    const users = await createUsers(dataSource);
    const classes = await createClasses(dataSource, disciplines, users, academicPeriods);
    
    // Criar dados relacionados às classes
    const activities = await createActivities(dataSource, classes);
    const materials = await createMaterials(dataSource, classes, users);
    const schedules = await createSchedules(dataSource, classes);
    const forums = await createForums(dataSource, classes);
    const lessonPlans = await createLessonPlans(dataSource, classes);
    
    // Criar availabilities
    const availabilities = await createAvailabilities(dataSource, users, academicPeriods);

    console.log('✅ Seed concluído com sucesso!');
    console.log(`📊 Dados criados:`);
    console.log(`   - ${academicPeriods.length} períodos letivos`);
    console.log(`   - ${courses.length} cursos`);
    console.log(`   - ${disciplines.length} disciplinas`);
    console.log(`   - ${users.length} usuários`);
    console.log(`   - ${classes.length} turmas`);
    console.log(`   - ${activities.length} atividades`);
    console.log(`   - ${materials.length} materiais`);
    console.log(`   - ${schedules.length} horários`);
    console.log(`   - ${forums.length} fóruns`);
    console.log(`   - ${lessonPlans.length} planos de aula`);
    console.log(`   - ${availabilities.length} disponibilidades`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await app.close();
  }
}

async function clearDatabase(dataSource: DataSource) {
  console.log('🧹 Limpando banco de dados...');
  
  const entities = [
    Availability,
    LessonPlan,
    Forum,
    Schedule,
    Material,
    Activity,
    Class,
    User,
    Discipline,
    Course,
    Role,
  ];

  for (const entity of entities) {
    await dataSource.getRepository(entity).clear();
  }
}


async function createAcademicPeriods(dataSource: DataSource): Promise<AcademicPeriod[]> {
  console.log('📅 Criando períodos letivos...');
  
  const academicPeriodRepository = dataSource.getRepository(AcademicPeriod);
  
  const periods = [
    { period: '2024.1' },
    { period: '2024.2' },
    { period: '2025.1' },
    { period: '2025.2' },
  ];

  const createdPeriods: AcademicPeriod[] = [];
  for (const periodData of periods) {
    let existingPeriod = await academicPeriodRepository.findOne({
      where: { period: periodData.period },
    });

    if (!existingPeriod) {
      existingPeriod = academicPeriodRepository.create(periodData);
      existingPeriod = await academicPeriodRepository.save(existingPeriod);
      console.log(`   ✅ Período criado: ${periodData.period}`);
    } else {
      console.log(`   ⏭️  Período já existe: ${periodData.period}`);
    }

    createdPeriods.push(existingPeriod);
  }

  return createdPeriods;
}

async function createCourses(dataSource: DataSource): Promise<Course[]> {
  console.log('🎓 Criando cursos...');
  
  const courseRepository = dataSource.getRepository(Course);
  
  const courses = [
    { name: 'Ciência da Computação', status: CourseStatus.ACTIVE },
    { name: 'Engenharia de Software', status: CourseStatus.ACTIVE },
    { name: 'Sistemas de Informação', status: CourseStatus.ACTIVE },
    { name: 'Análise e Desenvolvimento de Sistemas', status: CourseStatus.ACTIVE },
  ];

  const createdCourses: Course[] = [];
  for (const courseData of courses) {
    // Verificar se o curso já existe
    let existingCourse = await courseRepository.findOne({ 
      where: { name: courseData.name } 
    });
    
    if (!existingCourse) {
      const course = courseRepository.create(courseData);
      existingCourse = await courseRepository.save(course);
    }
    
    createdCourses.push(existingCourse);
  }

  return createdCourses;
}

async function createDisciplines(dataSource: DataSource, courses: Course[]): Promise<Discipline[]> {
  console.log('📚 Criando disciplinas...');
  
  const disciplineRepository = dataSource.getRepository(Discipline);
  
  const disciplines = [
    { name: 'Programação I', course: courses[0], credits: 4 },
    { name: 'Estruturas de Dados', course: courses[0], credits: 4 },
    { name: 'Algoritmos e Programação', course: courses[0], credits: 6 },
    { name: 'Banco de Dados I', course: courses[0], credits: 4 },
    { name: 'Desenvolvimento Web', course: courses[1], credits: 6 },
    { name: 'Arquitetura de Software', course: courses[1], credits: 4 },
    { name: 'Engenharia de Requisitos', course: courses[1], credits: 4 },
    { name: 'Gestão de Projetos', course: courses[2], credits: 4 },
    { name: 'Sistemas Operacionais', course: courses[2], credits: 4 },
    { name: 'Redes de Computadores', course: courses[3], credits: 4 },
  ];

  const createdDisciplines: Discipline[] = [];
  for (const disciplineData of disciplines) {
    // Verificar se a disciplina já existe
    let existingDiscipline = await disciplineRepository.findOne({ 
      where: { name: disciplineData.name } 
    });
    
    if (!existingDiscipline) {
      const discipline = disciplineRepository.create(disciplineData);
      existingDiscipline = await disciplineRepository.save(discipline);
    }
    
    createdDisciplines.push(existingDiscipline);
  }

  return createdDisciplines;
}

async function createUsers(dataSource: DataSource): Promise<User[]> {
  console.log('👤 Criando usuários...');
  
  const userRepository = dataSource.getRepository(User);
  
  const usersData = [
    {
      name: 'Prof. João Silva',
      email: 'joao.silva@ava.com',
      password: '123456',
      roleName: 'teacher',
    },
    {
      name: 'Prof. Maria Santos',
      email: 'maria.santos@ava.com',
      password: '123456',
      roleName: 'teacher',
    },
    {
      name: 'Prof. Pedro Costa',
      email: 'pedro.costa@ava.com',
      password: '123456',
      roleName: 'teacher',
    },
    {
      name: 'Ana Oliveira',
      email: 'ana.oliveira@ava.com',
      password: '123456',
      roleName: 'student',
    },
    {
      name: 'Carlos Mendes',
      email: 'carlos.mendes@ava.com',
      password: '123456',
      roleName: 'student',
    },
    {
      name: 'Fernanda Lima',
      email: 'fernanda.lima@ava.com',
      password: '123456',
      roleName: 'student',
    },
    {
      name: 'Coord. Paulo Andrade',
      email: 'paulo.andrade@ava.com',
      password: '123456',
      roleName: 'coordinator',
    },
  ];

  const roleRepository = dataSource.getRepository(Role);
  const createdUsers: User[] = [];
  
  for (const userData of usersData) {
    // Verificar se o usuário já existe
    let existingUser = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.email = :email', { email: userData.email })
      .getOne();
    
    if (!existingUser) {
      // Buscar role pelo nome
      const role = await roleRepository.findOne({ where: { name: userData.roleName } });
      if (!role) {
        throw new Error(`Role "${userData.roleName}" não encontrada! Execute primeiro "npm run init".`);
      }
      
      // Criar usuário sem roles primeiro
      const user = userRepository.create({
        name: userData.name,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
      });
      const savedUser = await userRepository.save(user);
      
      // Associar role ao usuário
      savedUser.roles = [role];
      existingUser = await userRepository.save(savedUser);
    } else {
      // Verificar se a senha precisa ser atualizada (se não estiver com hash)
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const needsPasswordUpdate = !existingUser.password || !existingUser.password.startsWith('$2');
      
      if (needsPasswordUpdate) {
        existingUser.password = passwordHash;
        await userRepository.save(existingUser);
        console.log(`   🔄 Senha atualizada para: ${userData.email}`);
      }
      
      // Verificar se a role está correta
      const role = await roleRepository.findOne({ where: { name: userData.roleName } });
      if (role && (!existingUser.roles || !existingUser.roles.some(r => r.name === userData.roleName))) {
        existingUser.roles = [role];
        await userRepository.save(existingUser);
        console.log(`   🔄 Role atualizada para: ${userData.email}`);
      }
    }
    
    createdUsers.push(existingUser);
  }

  return createdUsers;
}

async function createClasses(dataSource: DataSource, disciplines: Discipline[], users: User[], academicPeriods: AcademicPeriod[]): Promise<Class[]> {
  console.log('🏫 Criando turmas...');
  
  const classRepository = dataSource.getRepository(Class);
  
  const period20241 = academicPeriods.find(p => p.period === '2024.1')!;
  const period20242 = academicPeriods.find(p => p.period === '2024.2')!;
  
  const classes = [
    {
      code: 'CC2024-1-PROG1-A',
      academicPeriod: period20241,
      year: 2024,
      discipline: disciplines[0], // Programação I
      teacher: users[0], // Prof. João Silva
    },
    {
      code: 'CC2024-1-ED-A',
      academicPeriod: period20241,
      year: 2024,
      discipline: disciplines[1], // Estruturas de Dados
      teacher: users[1], // Prof. Maria Santos
    },
    {
      code: 'ES2024-1-WEB-A',
      academicPeriod: period20241,
      year: 2024,
      discipline: disciplines[4], // Desenvolvimento Web
      teacher: users[2], // Prof. Pedro Costa
    },
    {
      code: 'CC2024-2-PROG1-B',
      academicPeriod: period20242,
      year: 2024,
      discipline: disciplines[0], // Programação I
      teacher: users[0], // Prof. João Silva
    },
    {
      code: 'SI2024-1-GEST-A',
      academicPeriod: period20241,
      year: 2024,
      discipline: disciplines[7], // Gestão de Projetos
      teacher: users[1], // Prof. Maria Santos
    },
  ];

  const createdClasses: Class[] = [];
  for (const classData of classes) {
    // Verificar se a turma já existe
    let existingClass = await classRepository.findOne({ 
      where: { code: classData.code } 
    });
    
    if (!existingClass) {
      const classInstance = classRepository.create(classData);
      existingClass = await classRepository.save(classInstance);
    }
    
    createdClasses.push(existingClass);
  }

  return createdClasses;
}

async function createActivities(dataSource: DataSource, classes: Class[]): Promise<Activity[]> {
  console.log('📝 Criando atividades...');
  
  const activityRepository = dataSource.getRepository(Activity);
  
  const activities = [
    {
      class: classes[0],
      title: 'Exercícios de Variáveis e Operadores',
      description: 'Resolva os exercícios sobre declaração de variáveis e operadores aritméticos.',
      type: ActivityType.HOMEWORK,
      unit: ActivityUnit.FIRST_UNIT,
      dueDate: new Date('2024-03-15'),
      maxScore: 10.0,
    },
    {
      class: classes[0],
      title: 'Prova Parcial - Fundamentos',
      description: 'Prova sobre conceitos básicos de programação.',
      type: ActivityType.EXAM,
      unit: ActivityUnit.FIRST_UNIT,
      dueDate: new Date('2024-04-20'),
      maxScore: 50.0,
    },
    {
      class: classes[1],
      title: 'Implementação de Lista Encadeada',
      description: 'Implemente uma lista encadeada com operações básicas.',
      type: ActivityType.PROJECT,
      unit: ActivityUnit.SECOND_UNIT,
      dueDate: new Date('2024-05-10'),
      maxScore: 25.0,
    },
    {
      class: classes[2],
      title: 'Site Responsivo com HTML/CSS',
      description: 'Crie um site responsivo usando HTML5 e CSS3.',
      type: ActivityType.PROJECT,
      unit: ActivityUnit.SECOND_UNIT,
      dueDate: new Date('2024-06-15'),
      maxScore: 30.0,
    },
    {
      class: classes[3],
      title: 'Exercícios de Estruturas Condicionais',
      description: 'Resolva problemas usando if/else e switch.',
      type: ActivityType.HOMEWORK,
      unit: ActivityUnit.FIRST_UNIT,
      dueDate: new Date('2024-08-20'),
      maxScore: 15.0,
    },
  ];

  const createdActivities: Activity[] = [];
  for (const activityData of activities) {
    const activity = activityRepository.create(activityData);
    const savedActivity = await activityRepository.save(activity);
    createdActivities.push(savedActivity);
  }

  return createdActivities;
}

async function createMaterials(dataSource: DataSource, classes: Class[], users: User[]): Promise<Material[]> {
  console.log('📄 Criando materiais...');
  
  const materialRepository = dataSource.getRepository(Material);
  
  const materials = [
    {
      class: classes[0],
      title: 'Slides - Introdução à Programação',
      fileUrl: ['/materials/slides-prog1-intro.pdf'],
      description: 'Apresentação sobre conceitos básicos de programação.',
      uploadedBy: users[0], // Prof. João Silva
      uploadedAt: new Date(),
    },
    {
      class: classes[0],
      title: 'Exercícios Resolvidos - Capítulo 1',
      fileUrl: ['/materials/exercicios-cap1.pdf'],
      description: 'Exercícios resolvidos do primeiro capítulo.',
      uploadedBy: users[0], // Prof. João Silva
      uploadedAt: new Date(),
    },
    {
      class: classes[1],
      title: 'Material de Estudo - Estruturas de Dados',
      fileUrl: ['/materials/estruturas-dados.pdf'],
      description: 'Material completo sobre estruturas de dados.',
      uploadedBy: users[1], // Prof. Maria Santos
      uploadedAt: new Date(),
    },
    {
      class: classes[2],
      title: 'Tutorial HTML/CSS',
      fileUrl: ['/materials/tutorial-html-css.pdf'],
      description: 'Tutorial completo de HTML e CSS.',
      uploadedBy: users[2], // Prof. Pedro Costa
      uploadedAt: new Date(),
    },
    {
      class: classes[3],
      title: 'Slides - Estruturas Condicionais',
      fileUrl: ['/materials/slides-condicionais.pdf'],
      description: 'Apresentação sobre estruturas condicionais.',
      uploadedBy: users[0], // Prof. João Silva
      uploadedAt: new Date(),
    },
  ];

  const createdMaterials: Material[] = [];
  for (const materialData of materials) {
    const material = materialRepository.create(materialData);
    const savedMaterial = await materialRepository.save(material);
    createdMaterials.push(savedMaterial);
  }

  return createdMaterials;
}

async function createSchedules(dataSource: DataSource, classes: Class[]): Promise<Schedule[]> {
  console.log('⏰ Criando horários...');
  
  const scheduleRepository = dataSource.getRepository(Schedule);
  
  const schedules = [
    {
      class: classes[0],
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '08:00',
      endTime: '10:00',
      room: 'Lab 101',
    },
    {
      class: classes[0],
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '08:00',
      endTime: '10:00',
      room: 'Lab 101',
    },
    {
      class: classes[1],
      dayOfWeek: DayOfWeek.TUESDAY,
      startTime: '10:00',
      endTime: '12:00',
      room: 'Lab 102',
    },
    {
      class: classes[1],
      dayOfWeek: DayOfWeek.THURSDAY,
      startTime: '10:00',
      endTime: '12:00',
      room: 'Lab 102',
    },
    {
      class: classes[2],
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '14:00',
      endTime: '16:00',
      room: 'Lab 201',
    },
    {
      class: classes[2],
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '14:00',
      endTime: '16:00',
      room: 'Lab 201',
    },
    {
      class: classes[3],
      dayOfWeek: DayOfWeek.TUESDAY,
      startTime: '16:00',
      endTime: '18:00',
      room: 'Lab 103',
    },
    {
      class: classes[3],
      dayOfWeek: DayOfWeek.THURSDAY,
      startTime: '16:00',
      endTime: '18:00',
      room: 'Lab 103',
    },
  ];

  const createdSchedules: Schedule[] = [];
  for (const scheduleData of schedules) {
    const schedule = scheduleRepository.create(scheduleData);
    const savedSchedule = await scheduleRepository.save(schedule);
    createdSchedules.push(savedSchedule);
  }

  return createdSchedules;
}

async function createForums(dataSource: DataSource, classes: Class[]): Promise<Forum[]> {
  console.log('💬 Criando fóruns...');
  
  const forumRepository = dataSource.getRepository(Forum);
  
  const forums = [
    {
      class: classes[0],
      title: 'Dúvidas sobre Exercícios',
      description: 'Fórum para tirar dúvidas sobre os exercícios da disciplina.',
    },
    {
      class: classes[0],
      title: 'Discussões Gerais',
      description: 'Fórum para discussões gerais sobre programação.',
    },
    {
      class: classes[1],
      title: 'Estruturas de Dados',
      description: 'Fórum específico para discussões sobre estruturas de dados.',
    },
    {
      class: classes[2],
      title: 'Desenvolvimento Web',
      description: 'Fórum para discussões sobre desenvolvimento web.',
    },
    {
      class: classes[3],
      title: 'Programação II',
      description: 'Fórum da turma de Programação II.',
    },
  ];

  const createdForums: Forum[] = [];
  for (const forumData of forums) {
    const forum = forumRepository.create(forumData);
    const savedForum = await forumRepository.save(forum);
    createdForums.push(savedForum);
  }

  return createdForums;
}

async function createLessonPlans(dataSource: DataSource, classes: Class[]): Promise<LessonPlan[]> {
  console.log('📋 Criando planos de aula...');
  
  const lessonPlanRepository = dataSource.getRepository(LessonPlan);
  
  const lessonPlans = [
    {
      class: classes[0],
      date: '2024-03-01',
      content: 'Aula 1: Introdução à programação e conceitos básicos. Apresentação da disciplina e objetivos.',
    },
    {
      class: classes[0],
      date: '2024-03-06',
      content: 'Aula 2: Variáveis e tipos de dados. Declaração e inicialização de variáveis.',
    },
    {
      class: classes[1],
      date: '2024-03-05',
      content: 'Aula 1: Introdução às estruturas de dados. Conceitos fundamentais.',
    },
    {
      class: classes[1],
      date: '2024-03-07',
      content: 'Aula 2: Arrays e listas. Implementação e operações básicas.',
    },
    {
      class: classes[2],
      date: '2024-03-04',
      content: 'Aula 1: Introdução ao desenvolvimento web. HTML básico.',
    },
    {
      class: classes[3],
      date: '2024-08-01',
      content: 'Aula 1: Revisão de conceitos básicos. Estruturas condicionais.',
    },
  ];

  const createdLessonPlans: LessonPlan[] = [];
  for (const lessonPlanData of lessonPlans) {
    const lessonPlan = lessonPlanRepository.create(lessonPlanData);
    const savedLessonPlan = await lessonPlanRepository.save(lessonPlan);
    createdLessonPlans.push(savedLessonPlan);
  }

  return createdLessonPlans;
}

async function createAvailabilities(dataSource: DataSource, users: User[], academicPeriods: AcademicPeriod[]): Promise<Availability[]> {
  console.log('📅 Criando disponibilidades...');
  
  const availabilityRepository = dataSource.getRepository(Availability);
  
  const period20241 = academicPeriods.find(p => p.period === '2024.1')!;
  const period20242 = academicPeriods.find(p => p.period === '2024.2')!;
  
  const availabilities = [
    // Prof. João Silva
    {
      teacher: users[0],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '08:00',
      endTime: '12:00',
    },
    {
      teacher: users[0],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '08:00',
      endTime: '12:00',
    },
    {
      teacher: users[0],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '08:00',
      endTime: '10:00',
    },
    {
      teacher: users[0],
      academicPeriod: period20242,
      dayOfWeek: DayOfWeek.TUESDAY,
      startTime: '08:00',
      endTime: '12:00',
    },
    {
      teacher: users[0],
      academicPeriod: period20242,
      dayOfWeek: DayOfWeek.THURSDAY,
      startTime: '08:00',
      endTime: '12:00',
    },
    
    // Prof. Maria Santos
    {
      teacher: users[1],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.TUESDAY,
      startTime: '10:00',
      endTime: '16:00',
    },
    {
      teacher: users[1],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.THURSDAY,
      startTime: '10:00',
      endTime: '16:00',
    },
    {
      teacher: users[1],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '14:00',
      endTime: '18:00',
    },
    
    // Prof. Pedro Costa
    {
      teacher: users[2],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '14:00',
      endTime: '18:00',
    },
    {
      teacher: users[2],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '14:00',
      endTime: '18:00',
    },
    {
      teacher: users[2],
      academicPeriod: period20241,
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '14:00',
      endTime: '18:00',
    },
  ];

  const createdAvailabilities: Availability[] = [];
  for (const availabilityData of availabilities) {
    const availability = availabilityRepository.create(availabilityData);
    const savedAvailability = await availabilityRepository.save(availability);
    createdAvailabilities.push(savedAvailability);
  }

  return createdAvailabilities;
}

// Executar o seed
if (require.main === module) {
  seed().catch(console.error);
}

export { seed };
