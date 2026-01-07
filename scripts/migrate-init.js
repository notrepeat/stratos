#!/usr/bin/env node

// Script to run initial migrations with root user
// Usage: pnpm run migrate:init

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// Load env
config();

async function runInitialMigrations() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_ROOT_USER,
    password: process.env.DB_ROOT_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });

  const db = drizzle(pool);

  try {
    console.log('🚀 Running initial migrations with root user...');
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('✅ Initial migrations completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runInitialMigrations();
