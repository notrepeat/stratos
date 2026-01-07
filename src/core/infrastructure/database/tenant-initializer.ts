import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { env } from '../../config/env.config';
import * as userSchema from './user.schema';
import * as invoiceSchema from './invoice.schema';
import * as paymentSchema from './payment.schema';
import * as sessionSchema from '../../../modules/auth/infrastructure/database/session.schema';

export async function initializeTenantDatabase(
  databaseName: string,
): Promise<void> {
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_ROOT_USER,
    password: env.DB_ROOT_PASSWORD,
    database: databaseName, // Connect to the specific tenant database
  });

  const db = drizzle(pool, {
    schema: {
      ...userSchema,
      ...invoiceSchema,
      ...paymentSchema,
      ...sessionSchema,
    },
  });

  try {
    console.log(`🏗️ Initializing tenant database: ${databaseName}`);

    // Run migrations to create tables
    await migrate(db, { migrationsFolder: './drizzle/migrations' });

    console.log(`✅ Tenant database initialized: ${databaseName}`);
  } catch (error) {
    console.error(
      `❌ Failed to initialize tenant database ${databaseName}:`,
      error,
    );
    throw new Error(`Failed to initialize tenant database: ${databaseName}`);
  } finally {
    await pool.end();
  }
}
