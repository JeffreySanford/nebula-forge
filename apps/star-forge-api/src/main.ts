import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true, // Enable CORS for all origins
    logger: ['error', 'warn', 'debug', 'log', 'verbose'], // Enable all log levels
  });
  
  // Configure app prefix and CORS
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true, // Allow all origins or specify allowed origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow cookies and authentication headers
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Start the HTTP server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  const logger = new Logger('Bootstrap');
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`WebSockets are available at: ws://localhost:${port}`);
}
bootstrap();
