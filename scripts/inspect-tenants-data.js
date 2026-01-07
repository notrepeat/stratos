#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function inspectTenantsData() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });

  try {
    console.log('🔍 Inspecting tenants data...');

    const result = await pool.query(`
      SELECT id, name, slug, domain, database_name, status, admin_email, admin_name
      FROM tenants
      ORDER BY created_at;
    `);

    console.log(`📋 Found ${result.rows.length} tenants:`);
    result.rows.forEach((tenant) => {
      console.log(`  - ${tenant.name} (${tenant.slug})`);
      console.log(`    Domain: ${tenant.domain}`);
      console.log(`    DB: ${tenant.database_name}`);
      console.log(`    Admin: ${tenant.admin_name} <${tenant.admin_email}>`);
      console.log(`    Status: ${tenant.status}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error inspecting data:', error);
  } finally {
    await pool.end();
  }
}

inspectTenantsData();
