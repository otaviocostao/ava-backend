import { Injectable } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppContextService } from './app-context.service';

@Injectable()
export class AppService {
  constructor(
    private readonly appContextService: AppContextService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  generateLlmTxt(): string {
    const app = this.appContextService.getApp();
    
    if (!app) {
      return '# Ava Backend API\n\nA aplicação ainda não foi inicializada completamente.';
    }

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Ava Backend API')
      .setDescription('Documentacao interativa com todos os endpoints REST expostos pela plataforma Ava.')
      .setVersion('1.0')
      .addTag('v1', 'Recursos estaveis disponiveis na primeira versao publica da API.')
      .build();
    
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    return this.formatSwaggerToLlmTxt(swaggerDocument, baseUrl);
  }

  private formatSwaggerToLlmTxt(document: any, baseUrl: string): string {
    const lines: string[] = [];
    
    lines.push('# Ava Backend API - Documentação para LLM');
    lines.push('');
    lines.push(`Versão: ${document.info.version}`);
    lines.push(`Descrição: ${document.info.description}`);
    lines.push(`Base URL: ${baseUrl}`);
    lines.push('');
    lines.push('## Visão Geral');
    lines.push('');
    lines.push('Esta é a API REST do sistema de gestão acadêmica AVA (Ambiente Virtual de Aprendizagem).');
    lines.push('A API fornece endpoints para gerenciar usuários, cursos, disciplinas, turmas, matrículas,');
    lines.push('notas, atividades, materiais e outros recursos acadêmicos.');
    lines.push('');
    lines.push('## Formato de Resposta');
    lines.push('');
    lines.push('A API retorna dados em formato JSON. Todos os IDs são UUIDs.');
    lines.push('');
    lines.push('## Endpoints da API');
    lines.push('');
    
    const paths = Object.keys(document.paths).sort();
    
    for (const path of paths) {
      const pathItem = document.paths[path];
      const methods = Object.keys(pathItem).filter(m => 
        ['get', 'post', 'put', 'patch', 'delete'].includes(m)
      );
      
      if (methods.length === 0) continue;
      
      lines.push(`### ${path}`);
      lines.push('');
      
      for (const method of methods) {
        const operation = pathItem[method];
        const tags = operation.tags || ['Geral'];
        const summary = operation.summary || 'Sem descrição';
        const description = operation.description || '';
        const methodUpper = method.toUpperCase();
        
        lines.push(`**${methodUpper}** ${path}`);
        lines.push(`Descrição: ${summary}`);
        
        if (description) {
          lines.push(`Detalhes: ${description}`);
        }
        
        if (operation.parameters && operation.parameters.length > 0) {
          lines.push('Parâmetros:');
          for (const param of operation.parameters) {
            const required = param.required ? ' (obrigatório)' : ' (opcional)';
            const paramType = param.schema?.type || 'string';
            lines.push(`  - ${param.name}: ${paramType}${required} - ${param.description || 'Sem descrição'}`);
          }
        }
        
        if (operation.requestBody) {
          lines.push('Corpo da requisição: JSON');
          if (operation.requestBody.content && operation.requestBody.content['application/json']) {
            const schema = operation.requestBody.content['application/json'].schema;
            if (schema.properties) {
              lines.push('Propriedades:');
              for (const [propName, propSchema] of Object.entries(schema.properties)) {
                const required = schema.required?.includes(propName) ? ' (obrigatório)' : ' (opcional)';
                const propType = (propSchema as any).type || 'string';
                lines.push(`  - ${propName}: ${propType}${required}`);
              }
            }
          }
        }
        
        if (operation.responses) {
          const statusCodes = Object.keys(operation.responses).sort();
          if (statusCodes.length > 0) {
            lines.push('Respostas:');
            for (const statusCode of statusCodes) {
              const response = operation.responses[statusCode];
              lines.push(`  - ${statusCode}: ${response.description || 'Sem descrição'}`);
            }
          }
        }
        
        lines.push(`Tags: ${tags.join(', ')}`);
        lines.push('');
      }
    }
    
    lines.push('## Recursos Disponíveis');
    lines.push('');
    lines.push('A API possui os seguintes módulos principais:');
    lines.push('');
    lines.push('- **Users**: Gerenciamento de usuários do sistema');
    lines.push('- **Roles**: Perfis e permissões de acesso');
    lines.push('- **Courses**: Cursos oferecidos pela instituição');
    lines.push('- **Departments**: Departamentos acadêmicos');
    lines.push('- **Disciplines**: Disciplinas dos cursos');
    lines.push('- **Classes**: Turmas e aulas');
    lines.push('- **Enrollments**: Matrículas de estudantes');
    lines.push('- **Grades**: Notas e avaliações');
    lines.push('- **Activities**: Atividades acadêmicas');
    lines.push('- **Materials**: Materiais didáticos');
    lines.push('- **News**: Notícias e avisos');
    lines.push('- **Forums**: Fóruns de discussão');
    lines.push('- **ForumPosts**: Posts em fóruns');
    lines.push('- **Messages**: Mensagens entre usuários');
    lines.push('- **Payments**: Pagamentos e mensalidades');
    lines.push('- **Attendances**: Controle de presença');
    lines.push('- **VideoLessons**: Aulas em vídeo');
    lines.push('- **LessonPlans**: Planos de aula');
    lines.push('- **Availabilities**: Disponibilidades de professores');
    lines.push('- **Schedules**: Horários e cronogramas');
    lines.push('- **NoticeBoard**: Quadro de avisos');
    lines.push('');
    lines.push('## Documentação Interativa');
    lines.push('');
    lines.push(`Para documentação completa e interativa, acesse: ${baseUrl}/api`);
    lines.push('A documentação Swagger permite testar os endpoints diretamente no navegador.');
    lines.push('');
    lines.push('## Notas Importantes');
    lines.push('');
    lines.push('- Todos os IDs são UUIDs no formato padrão');
    lines.push('- Use Content-Type: application/json para requisições POST, PUT e PATCH');
    lines.push('- Respostas de sucesso seguem os códigos HTTP padrão (200, 201, 204)');
    lines.push('- Erros retornam códigos HTTP apropriados (400, 401, 403, 404, 500)');
    lines.push('- Validação de dados é feita automaticamente usando class-validator');
    lines.push('');
    
    return lines.join('\n');
  }
}
