#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env' });

async function testDatabaseIsolation() {
  console.log('🧪 Testing database isolation...\n');

  // Connect to both tenant databases
  const tenantA_Pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: 'postgres',
    password: process.env.DB_ROOT_PASSWORD,
    database: 'saas_tenant_01KECGJZCHNXCWMN', // Empresa A
    ssl: false,
  });

  const tenantB_Pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: 'postgres',
    password: process.env.DB_ROOT_PASSWORD,
    database: 'saas_tenant_01KECGK4FRB6KGH1', // Empresa B
    ssl: false,
  });

  try {
    // Insert test data in Empresa A
    console.log('📝 Inserting test user in Empresa A...');
    await tenantA_Pool.query(`
      INSERT INTO users (id, email, name, password, tenant_id, is_super_admin, created_at, updated_at)
      VALUES ('test-user-a', 'user@empresa-a.com', 'Usuario Empresa A', 'hashed_password', 'empresa-a-tenant', false, NOW(), NOW())
    `);

    // Insert test data in Empresa B
    console.log('📝 Inserting test user in Empresa B...');
    await tenantB_Pool.query(`
      INSERT INTO users (id, email, name, password, tenant_id, is_super_admin, created_at, updated_at)
      VALUES ('test-user-b', 'user@empresa-b.com', 'Usuario Empresa B', 'hashed_password', 'empresa-b-tenant', false, NOW(), NOW())
    `);

    // Check data in Empresa A
    console.log('\n📋 Users in Empresa A database:');
    const usersA = await tenantA_Pool.query(
      'SELECT id, email, name FROM users',
    );
    usersA.rows.forEach((user) => {
      console.log(`  - ${user.name} (${user.email})`);
    });

    // Check data in Empresa B
    console.log('\n📋 Users in Empresa B database:');
    const usersB = await tenantB_Pool.query(
      'SELECT id, email, name FROM users',
    );
    usersB.rows.forEach((user) => {
      console.log(`  - ${user.name} (${user.email})`);
    });

    // Analysis
    console.log('\n📊 Analysis:');
    const hasA_UserA = usersA.rows.some(
      (u) => u.email === 'user@empresa-a.com',
    );
    const hasA_UserB = usersA.rows.some(
      (u) => u.email === 'user@empresa-b.com',
    );
    const hasB_UserA = usersB.rows.some(
      (u) => u.email === 'user@empresa-a.com',
    );
    const hasB_UserB = usersB.rows.some(
      (u) => u.email === 'user@empresa-b.com',
    );

    if (hasA_UserA && !hasA_UserB && hasB_UserB && !hasB_UserA) {
      console.log('✅ SUCCESS: Database isolation working perfectly!');
      console.log('   - Empresa A only has its own user');
      console.log('   - Empresa B only has its own user');
      console.log('   - No cross-database data leakage');
    } else {
      console.log('❌ FAILURE: Database isolation not working');
      console.log(`   - Empresa A has user from A: ${hasA_UserA}`);
      console.log(`   - Empresa A has user from B: ${hasA_UserB}`);
      console.log(`   - Empresa B has user from A: ${hasB_UserA}`);
      console.log(`   - Empresa B has user from B: ${hasB_UserB}`);
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await tenantA_Pool.end();
    await tenantB_Pool.end();
  }
}

testDatabaseIsolation();
