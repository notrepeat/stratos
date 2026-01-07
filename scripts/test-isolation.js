#!/usr/bin/env node

async function testDataIsolation() {
  const baseUrl = 'http://localhost:3001';

  console.log('🧪 Testing data isolation between tenants...\n');

  // Test 1: Create user in Empresa A
  console.log('📝 Creating user in Empresa A...');
  const userA = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Host: 'empresa-a.localhost',
    },
    body: JSON.stringify({
      email: 'user@empresa-a.com',
      name: 'Usuario Empresa A',
      password: 'password123',
      tenantId: 'empresa-a-tenant-id', // This should be ignored/overridden by middleware
    }),
  });

  const userAData = await userA.json();
  console.log('Response:', userAData);

  // Test 2: Create user in Empresa B
  console.log('\n📝 Creating user in Empresa B...');
  const userB = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Host: 'empresa-b.localhost',
    },
    body: JSON.stringify({
      email: 'user@empresa-b.com',
      name: 'Usuario Empresa B',
      password: 'password123',
      tenantId: 'empresa-b-tenant-id',
    }),
  });

  const userBData = await userB.json();
  console.log('Response:', userBData);

  // Test 3: List users in Empresa A (should only see user from Empresa A)
  console.log('\n📋 Listing users in Empresa A...');
  const usersA = await fetch(`${baseUrl}/api/users`, {
    headers: {
      Host: 'empresa-a.localhost',
    },
  });

  const usersAData = await usersA.json();
  console.log('Users in Empresa A:', usersAData);

  // Test 4: List users in Empresa B (should only see user from Empresa B)
  console.log('\n📋 Listing users in Empresa B...');
  const usersB = await fetch(`${baseUrl}/api/users`, {
    headers: {
      Host: 'empresa-b.localhost',
    },
  });

  const usersBData = await usersB.json();
  console.log('Users in Empresa B:', usersBData);

  // Analysis
  console.log('\n📊 Analysis:');
  if (usersAData.length === 1 && usersBData.length === 1) {
    console.log('✅ SUCCESS: Data isolation working correctly');
    console.log('   - Empresa A has 1 user');
    console.log('   - Empresa B has 1 user');
    console.log('   - No cross-tenant data leakage');
  } else {
    console.log('❌ FAILURE: Data isolation not working');
    console.log(`   - Empresa A has ${usersAData.length} users`);
    console.log(`   - Empresa B has ${usersBData.length} users`);
  }
}

testDataIsolation().catch(console.error);
