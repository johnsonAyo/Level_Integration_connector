import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const DEFAULT_PORT = 4000;
let server: any;

async function bootstrap() {
  const instance = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(instance));
  app.enableCors({ origin: '*' }); // Simplified for Vercel
  await app.init();
  return instance;
}

// For standalone execution
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then((instance) => {
    instance.listen(process.env.PORT ?? DEFAULT_PORT, () => {
      console.log(`Backend server listening on port ${process.env.PORT ?? DEFAULT_PORT}`);
    });
  });
}

// For Vercel serverless handler
export default async (req: any, res: any) => {
  if (!server) {
    server = await bootstrap();
  }
  return server(req, res);
};

