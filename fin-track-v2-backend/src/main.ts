import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadEnvFile } from 'node:process';
import { AppModule, ObserveInstrument } from './app.module.js';
import 'pg';

try {
  loadEnvFile();
} catch {
  // The process environment already has the variables, or there is no .env file.
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  app.useBodyParser('raw', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    limit: '2mb',
  });
  // Browser clients (the Next frontend, Swagger UI opened from another origin)
  // may only call this API from an allowed Origin. CORS_ORIGIN is a comma-separated
  // list of those origins (scheme + host + port). Without the variable, only the
  // Compose-published frontend at http://localhost:3010 is allowed. Same-origin
  // or non-browser clients (curl, server-side BACKEND_URL) are not gated by CORS.
  // app.enableCors({
  //   origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3010'],
  // });

  const config = new DocumentBuilder()
    .setTitle('Fin Track API')
    .setDescription(
      'API de Fin Track. Autenticá con `POST /auth/token` y enviá el `access_token` como Bearer.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    customSiteTitle: 'Fin Track API',
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
