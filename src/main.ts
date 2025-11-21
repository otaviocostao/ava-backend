import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppContextService } from './app-context.service';

const allowedOrigins = [
  'http://localhost:3000',
];

export class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    options.cors = { origin: allowedOrigins };
    const server = super.createIOServer(port, options);
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const appContextService = app.get(AppContextService);
  appContextService.setApp(app);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Origem não permitida pelo CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useWebSocketAdapter(new SocketIoAdapter(app));
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ava Backend API')
    .setDescription('Documentacao interativa com todos os endpoints REST expostos pela plataforma Ava.')
    .setVersion('1.0')
    .addTag('v1', 'Recursos estaveis disponiveis na primeira versao publica da API.')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Digite o token JWT obtido no endpoint /auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      tagsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📄 Documentação Swagger disponível em: http://localhost:${port}/api`);
}
bootstrap();