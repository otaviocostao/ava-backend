import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

async function initializeSystem() {
  console.log('🚀 Inicializando sistema AVA...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const configService = app.get(ConfigService);

  try {
    // Verificar se já existem roles no sistema
    const roleRepository = dataSource.getRepository(Role);
    const existingRoles = await roleRepository.find();

    if (existingRoles.length > 0) {
      console.log('✅ Sistema já inicializado!');
      console.log(`📊 Roles encontradas: ${existingRoles.length}`);
      existingRoles.forEach(role => {
        console.log(`   - ${role.name}`);
      });
      
      // Verificar se existe usuário admin
      const userRepository = dataSource.getRepository(User);
      const adminUser = await userRepository.findOne({
        where: { email: 'admin@ava.com' },
        relations: ['roles']
      });

      if (adminUser) {
        console.log('👤 Usuário admin encontrado:');
        console.log(`   - Email: ${adminUser.email}`);
        console.log(`   - Nome: ${adminUser.name}`);
        console.log(`   - Roles: ${adminUser.roles.map(r => r.name).join(', ')}`);
      } else {
        console.log('⚠️  Usuário admin não encontrado!');
        console.log('💡 Execute o script de seed completo para criar dados de teste.');
      }
      
      return;
    }

    console.log('🆕 Primeira execução detectada!');
    console.log('🔧 Criando estrutura inicial do sistema...');

    // Obter senha do admin
    const adminPassword = configService.get<string>('INITIAL_ADMIN_PASSWORD', '123456');

    // Criar roles básicas
    const roles = await createInitialRoles(dataSource);
    console.log(`✅ ${roles.length} roles criadas com sucesso!`);

    // Criar usuário admin
    const adminUser = await createAdminUser(dataSource, roles, configService);
    console.log(`✅ Usuário admin criado: ${adminUser.email}`);

    console.log('\n🎉 Sistema inicializado com sucesso!');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute "npm run seed" para criar dados de teste');
    console.log('   2. Ou crie manualmente cursos, disciplinas e turmas');
    console.log('   3. Acesse o sistema com:');
    console.log(`      - Email: ${adminUser.email}`);
    console.log(`      - Senha: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error);
  } finally {
    await app.close();
  }
}

async function createInitialRoles(dataSource: DataSource): Promise<Role[]> {
  console.log('👥 Criando roles básicas...');
  
  const roleRepository = dataSource.getRepository(Role);
  
  const rolesData = [
    { name: 'admin' },
    { name: 'teacher' },
    { name: 'student' },
  ];

  const createdRoles: Role[] = [];
  for (const roleData of rolesData) {
    const role = roleRepository.create(roleData);
    const savedRole = await roleRepository.save(role);
    createdRoles.push(savedRole);
    console.log(`   ✅ Role "${roleData.name}" criada`);
  }

  return createdRoles;
}

async function createAdminUser(dataSource: DataSource, roles: Role[], configService: ConfigService): Promise<User> {
  console.log('👤 Criando usuário administrador...');
  
  const userRepository = dataSource.getRepository(User);
  
  // Buscar role de admin
  const adminRole = roles.find(role => role.name === 'admin');
  if (!adminRole) {
    throw new Error('Role de admin não encontrada!');
  }

  // Criar usuário admin
  const adminPassword = configService.get<string>('INITIAL_ADMIN_PASSWORD', '123456');
  const adminUserData = {
    name: 'Administrador do Sistema',
    email: 'admin@ava.com',
    password: adminPassword,
  };

  const adminUser = userRepository.create(adminUserData);
  const savedAdminUser = await userRepository.save(adminUser);
  
  // Associar role de admin
  savedAdminUser.roles = [adminRole];
  await userRepository.save(savedAdminUser);

  console.log(`   ✅ Usuário admin criado: ${adminUserData.email}`);
  console.log(`   ✅ Role "${adminRole.name}" associada`);

  return savedAdminUser;
}

// Executar a inicialização
if (require.main === module) {
  initializeSystem().catch(console.error);
}

export { initializeSystem };
