import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  app.enableCors();

  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`Middleware Service running on port ${port}`);
  console.log(`Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
  console.log(`RabbitMQ: ${process.env.RABBITMQ_URL}`);
}
bootstrap();
