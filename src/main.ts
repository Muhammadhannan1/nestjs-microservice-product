import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(); // Optional: Ensures graceful shutdown

  await app.listen(4100); // Adjust the port as needed
  console.log('Consumer is listening...');
}

bootstrap();
