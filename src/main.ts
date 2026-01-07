import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from '@config';
import { ensureDatabaseExists } from './core/infrastructure/database/provisioner';
import { runMigrations } from './core/infrastructure/database/migrator';
import { syncSpiceDBSchema } from './core/infrastructure/permissions/validator';
import { testS3Connection as validateStorage } from './core/infrastructure/storage/validator';
// SuperAdminService now moved to Users slice
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
// Load environment variables from .env file
config({ path: '.env' });

async function bootstrap() {
  console.log('🚀 Starting bootstrap sequence...\n');

  try {
    // Phase 1: Environment
    console.log('📋 Phase 1: Environment Validation');
    console.log(`   NODE_ENV: ${env.NODE_ENV}`);
    console.log(`   PORT: ${env.PORT}`);
    console.log('   ✅ Environment validated\n');

    // Phase 2: Database
    console.log('📋 Phase 2: Database Provisioning');
    await ensureDatabaseExists();

    // Run migrations with app user (assumes tables exist or user has permissions)
    console.log('🔄 Running database migrations...');
    try {
      await runMigrations();
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      // If this is the first run and tables don't exist, inform user to run manually with root
      if ((error as Error).message?.includes('does not exist')) {
        console.error('❌ Migration failed: Tables do not exist.');
        console.error('💡 SOLUTION: Run migrations manually first:');
        console.error(
          '   1. Temporarily set DB_USER and DB_PASSWORD to root credentials in .env',
        );
        console.error('   2. Run: pnpm exec drizzle-kit migrate');
        console.error('   3. Restore app user credentials');
        throw error;
      } else {
        throw error;
      }
    }

    console.log('   ✅ Database ready\n');

    // Phase 3: Permissions
    console.log('📋 Phase 3: Permission System');
    await syncSpiceDBSchema();
    console.log('   ✅ SpiceDB ready\n');

    // Phase 4: Storage
    console.log('📋 Phase 4: Storage System');
    await validateStorage();
    console.log('   ✅ S3 ready\n');

    // Phase 5: Start Server
    console.log('📋 Phase 5: Starting NestJS Application');
    const app = await NestFactory.create(AppModule);

    app.enableCors();
    app.setGlobalPrefix('api');

    // Apply global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.listen(env.PORT);

    console.log('\n🎉 ================================');
    console.log(`🎉 Server is running on port ${env.PORT}`);
    console.log('🎉 All systems operational');
    console.log('🎉 ================================\n');
  } catch (error) {
    console.error('\n💀 ================================');
    console.error('💀 BOOTSTRAP FAILED');
    console.error('💀 ================================\n');
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
