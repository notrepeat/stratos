// Load environment variables from .env file FIRST
import { config } from 'dotenv';
config({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from '@config';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
import { testS3Connection } from './core/infrastructure/storage/validator';

async function bootstrap() {
  console.log('🚀 Starting bootstrap sequence...\n');

  try {
    // Phase 1: Environment
    console.log('📋 Phase 1: Environment Validation');
    console.log(`   NODE_ENV: ${env.NODE_ENV}`);
    console.log(`   PORT: ${env.PORT}`);
    console.log('   ✅ Environment validated\n');

    // Phase 2: S3 Validation
    console.log('📋 Phase 2: S3 Validation');
    await testS3Connection();
    console.log('   ✅ S3 validated\n');

    // Phase 5: Start Server
    console.log('📋 Phase 5: Starting NestJS Application');
    const app = await NestFactory.create(AppModule);

    app.enableCors();
    app.setGlobalPrefix('api/v1');

    // Apply global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.listen(env.PORT);

    console.log('\n🎉 ================================');
    console.log(`🎉 Server is running on port ${env.PORT}`);
    console.log(
      `🎉 GraphQL endpoint available at: http://localhost:${env.PORT}/graphql`,
    );
    console.log('🎉 ================================\n');
  } catch (error) {
    console.error('\n💀 ================================');
    console.error('💀 BOOTSTRAP FAILED');
    console.error('💀 ================================\n');
    console.error(error);
    process.exit(1);
  }
}

(async () => {
  await bootstrap();
})();
