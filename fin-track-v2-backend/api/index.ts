import type { Request, Response } from 'express';
import express from 'express';
import { createNestApp } from '../dist/create-app.js';

const server = express();
let cached: typeof server | undefined;

async function bootstrap() {
  if (!cached) {
    const app = await createNestApp(server);
    await app.init();
    cached = server;
  }
  return cached;
}

export default async (req: Request, res: Response) => {
  const handler = await bootstrap();
  handler(req, res);
};
