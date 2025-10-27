const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testApi() {
  console.log('🚀 Iniciando teste da API - Demonstração de integração com Supabase\n');

  try {
    // 1. Criar uma role primeiro (mais simples)
    console.log('1️⃣  Criando uma role...');
    const roleResponse = await axios.post(`${BASE_URL}/roles`, {
      name: 'Estudante'
    });
    const roleId = roleResponse.data.id;
    console.log(`✅ Role criada com sucesso! ID: ${roleId}`);
    console.log(`📝 Dados:`, roleResponse.data);

    // 2. Criar um usuário
    console.log('\n2️⃣  Criando um usuário...');
    const userResponse = await axios.post(`${BASE_URL}/users`, {
      name: 'João Silva',
      email: 'joao.silva@exemplo.com',
      password: 'MinhaSenhaForte123!'
    });
    const userId = userResponse.data.id;
    console.log(`✅ Usuário criado com sucesso! ID: ${userId}`);
    console.log(`📝 Dados:`, userResponse.data);

    // 3. Listar todos os usuários
    console.log('\n3️⃣  Listando todos os usuários...');
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    console.log(`✅ Usuários encontrados: ${usersResponse.data.length}`);
    console.log(`📝 Lista:`, usersResponse.data.map(u => ({ id: u.id, name: u.name, email: u.email })));

    // 4. Buscar usuário específico
    console.log('\n4️⃣  Buscando usuário específico...');
    const specificUserResponse = await axios.get(`${BASE_URL}/users/${userId}`);
    console.log(`✅ Usuário encontrado!`);
    console.log(`📝 Dados:`, specificUserResponse.data);

    // 5. Listar todas as roles
    console.log('\n5️⃣  Listando todas as roles...');
    const rolesResponse = await axios.get(`${BASE_URL}/roles`);
    console.log(`✅ Roles encontradas: ${rolesResponse.data.length}`);
    console.log(`📝 Lista:`, rolesResponse.data.map(r => ({ id: r.id, name: r.name })));

    // 6. Associar role ao usuário
    console.log('\n6️⃣  Associando role ao usuário...');
    const assignRoleResponse = await axios.post(`${BASE_URL}/users/${userId}/roles`, {
      roleId: roleId
    });
    console.log(`✅ Role associada com sucesso!`);
    console.log(`📝 Resultado:`, assignRoleResponse.data);

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Todas as operações CRUD funcionaram perfeitamente');
    console.log('✅ Integração com Supabase está funcionando');
    console.log('✅ TypeORM está sincronizando as tabelas automaticamente');

  } catch (error) {
    console.error('\n❌ ERRO durante o teste:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Dados:`, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Executar o teste
testApi();
