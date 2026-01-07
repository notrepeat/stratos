#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env' });

async function checkTenantDatabases() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: 'postgres',
    password: process.env.DB_ROOT_PASSWORD,
    database: 'postgres',
    ssl: false,
  });

  try {
    console.log('🔍 Checking tenant databases...');

    // List all databases
    const result = await pool.query(`
      SELECT datname FROM pg_database
      WHERE datname LIKE 'saas_tenant_%'
      ORDER BY datname;
    `);

    console.log('📋 Tenant databases:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.datname}`);
    });

    // Check tables in first tenant DB
    if (result.rows.length > 0) {
      const tenantDb = result.rows[0].datname;
      const tenantPool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        user: 'postgres',
        password: process.env.DB_ROOT_PASSWORD,
        database: tenantDb,
        ssl: false,
      });

      const tables = await tenantPool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);

      console.log(`📋 Tables in ${tenantDb}:`);
      tables.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });

      await tenantPool.end();
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTenantDatabases();
