#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function inspectTenantsTable() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });

  try {
    console.log('🔍 Inspecting tenants table structure...');

    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'tenants'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ tenants table does not exist');
      return;
    }

    // Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'tenants'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Current tenants table structure:');
    columns.rows.forEach((col) => {
      console.log(
        `  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default || ''}`,
      );
    });
  } catch (error) {
    console.error('❌ Error inspecting table:', error);
  } finally {
    await pool.end();
  }
}

inspectTenantsTable();
