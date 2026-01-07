#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env' });

async function checkMigrations() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: 'postgres', // Use root user
    password: process.env.DB_ROOT_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });

  try {
    console.log('🔍 Checking migration status...');

    // Check if tenants table exists and has the new structure
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'tenants'
      AND column_name IN ('domain', 'database_name', 'admin_email')
      ORDER BY column_name;
    `);

    console.log('📋 Tenants table columns:');
    result.rows.forEach((row) => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    if (result.rows.length >= 3) {
      console.log('✅ Migrations appear to be applied correctly');
    } else {
      console.log('❌ Migrations may not be fully applied');
    }
  } catch (error) {
    console.error('❌ Error checking migrations:', error);
  } finally {
    await pool.end();
  }
}

checkMigrations();
