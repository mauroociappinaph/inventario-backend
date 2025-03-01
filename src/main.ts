import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter, ValidationExceptionFilter } from './common/filters';
import { CacheInterceptor, LoggingInterceptor, TimeoutInterceptor, TransformInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no decoradas
      forbidNonWhitelisted: true, // Rechaza datos con propiedades no decoradas
      transform: true, // Transforma automáticamente los datos a los tipos definidos
      transformOptions: {
        enableImplicitConversion: true, // Permite conversiones implícitas
      },
    }),
  );

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

  // Habilitar CORS
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
