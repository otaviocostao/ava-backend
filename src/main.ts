import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppContextService } from './app-context.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const appContextService = app.get(AppContextService);
  appContextService.setApp(app);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  
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
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      tagsSorter: 'alpha',
    },
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
