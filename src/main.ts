import basicAuth from 'express-basic-auth';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Origens separadas por vírgula. Padrão: front web (3001) e app mobile rodando na web (8081).
  // Apps nativos (iOS/Android) não enviam Origin e não passam por CORS.
  const corsOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:3001,http://localhost:8081'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ProcureFlow API')
    .setDescription(
      'API para gerenciamento de usuários e solicitações de compra, incluindo autenticação JWT e fluxo de aprovação.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
const swaggerUser = process.env.SWAGGER_USER;
const swaggerPassword = process.env.SWAGGER_PASSWORD;

if (!swaggerUser || !swaggerPassword) {
  throw new Error(
    'Configure SWAGGER_USER e SWAGGER_PASSWORD no arquivo .env.',
  );
}

app.use(
  ['/api/docs', '/api/docs-json'],
  basicAuth({
    users: {
      [swaggerUser]: swaggerPassword,
    },
    challenge: true,
  }),
);

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
