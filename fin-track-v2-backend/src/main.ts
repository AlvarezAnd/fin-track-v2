import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { loadEnvFile } from 'node:process';
import { AppModule, ObserveInstrument } from './app.module.js';

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
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3010'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
