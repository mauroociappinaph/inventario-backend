import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter, ValidationExceptionFilter } from './common/filters';
import { CacheInterceptor, LoggingInterceptor, TimeoutInterceptor, TransformInterceptor } from './common/interceptors';
import * as helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuración global de pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no decoradas
      forbidNonWhitelisted: true, // Rechaza datos con propiedades no decoradas
      transform: true, // Transforma automáticamente los datos recibidos a los tipos especificados
    }),
  );

  // Configuración de seguridad con Helmet v8
  // En la versión 8 de Helmet, debemos importarlo de manera diferente y usarlo sin paréntesis
  app.use(helmet.default());

  // Habilitar CORS para desarrollo
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      process.env.FRONTEND_URL
    ].filter(Boolean), // Filtrar valores null o undefined
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Accept',
    maxAge: 3600, // 1 hora de caché para respuestas preflight
  });

  // Configuración de compresión
  app.use(compression());

  // Middleware para parsear cookies
  app.use(cookieParser());

  // Configuración de Swagger para documentación API
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inventory API')
    .setDescription('API para gestión de inventario')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Obtener puerto de las variables de entorno o usar 3001 como alternativa
  const port = configService.get<number>('PORT') || 3001;

  // Aplicar filtros de excepciones globalmente
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
  );

  // Aplicar interceptores globalmente
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
    new CacheInterceptor(),
    new TransformInterceptor(),
  );

  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
}
bootstrap();
