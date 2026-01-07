import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { env } from '../../config/env.config';

export async function runMigrations(): Promise<void> {
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_ROOT_USER, // Use root user for migrations
    password: env.DB_ROOT_PASSWORD,
    database: env.DB_NAME,
  });

  const db = drizzle(pool);

  try {
    console.log('🔄 Running database migrations...');
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}
