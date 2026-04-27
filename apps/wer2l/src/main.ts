import { NestFactory } from '@nestjs/core';
import { Wer2lModule } from './wer2l.module';

async function bootstrap() {
  const app = await NestFactory.create(Wer2lModule);
  await app.listen(process.env.port ?? 4000);
}
bootstrap();
