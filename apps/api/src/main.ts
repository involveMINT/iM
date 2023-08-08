import { apiEnvironment, environment } from '@involvemint/shared/domain';
import { NestFactory } from '@nestjs/core';
import * as admin from 'firebase-admin';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import { AppModule } from './app/app.module';

initializeTransactionalContext();
patchTypeORMRepositoryWithBaseRepository();

admin.initializeApp({ credential: admin.credential.cert(apiEnvironment.gcp) });

async function bootstrap() {
  // const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // app.useWebSocketAdapter(new IoAdapter(app));

  if (environment.production) {
    const port = Number(process.env.PORT) || 8080;
    await app.listen(port);
  } else {
    await app.listen(3335, environment.host);
  }

  console.log(`involveMINT API is running on: ${await app.getUrl()}`);
}

bootstrap();
