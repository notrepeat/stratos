#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env' });

async function checkUsersAndPermissions() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: 'postgres', // Use root user
    password: process.env.DB_ROOT_PASSWORD,
    database: 'postgres', // Connect to postgres DB
    ssl: false,
  });

  try {
    console.log('🔍 Checking users and permissions...');

    // Check if user exists
    const userExists = await pool.query(`
      SELECT 1 FROM pg_roles WHERE rolname = 'stratos'
    `);

    console.log('User stratos exists:', userExists.rows.length > 0);

    // Check user permissions on saas_prod database
    const dbPerms = await pool.query(`
      SELECT
        r.rolname,
        d.datname,
        has_database_privilege(r.rolname, d.datname, 'CONNECT') as can_connect,
        has_database_privilege(r.rolname, d.datname, 'CREATE') as can_create
      FROM pg_roles r
      CROSS JOIN pg_database d
      WHERE r.rolname = 'stratos' AND d.datname = 'saas_prod'
    `);

    console.log('Database permissions for stratos:');
    console.log(dbPerms.rows[0]);
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await pool.end();
  }
}

checkUsersAndPermissions();
