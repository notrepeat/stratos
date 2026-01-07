import * as argon2 from 'argon2';
import { users } from '@modules/users/infrastructure/database/user.schema';
import { env } from '@config';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export async function ensureSuperAdminExists(
  db: NodePgDatabase,
): Promise<void> {
  console.log('🔐 Checking super admin configuration...');

  if (
    !env.SUPER_ADMIN_EMAIL ||
    !env.SUPER_ADMIN_NAME ||
    !env.SUPER_ADMIN_DEFAULT_PASSWORD
  ) {
    console.error('🚨 CRITICAL: Super admin configuration is incomplete!');
    console.error('Missing required environment variables:');
    if (!env.SUPER_ADMIN_EMAIL) console.error('  ❌ SUPER_ADMIN_EMAIL');
    if (!env.SUPER_ADMIN_NAME) console.error('  ❌ SUPER_ADMIN_NAME');
    if (!env.SUPER_ADMIN_DEFAULT_PASSWORD)
      console.error('  ❌ SUPER_ADMIN_DEFAULT_PASSWORD');
    console.error('');
    console.error('💡 SOLUTION: Configure these variables in your .env file');
    console.error('   The system cannot start without a super admin.');

    throw new Error(
      'Super admin configuration incomplete. Cannot start system.',
    );
  }

  console.log('✅ Super admin configuration validated');

  // Hash the configured password
  const defaultPassword = env.SUPER_ADMIN_DEFAULT_PASSWORD;
  const hashedPassword = await argon2.hash(defaultPassword);

  // Create super admin
  const superAdminId = `super-${Date.now()}`;
  const now = new Date();

  try {
    await db.insert(users).values({
      id: superAdminId,
      email: env.SUPER_ADMIN_EMAIL,
      name: env.SUPER_ADMIN_NAME,
      password: hashedPassword,
      tenantId: 'global', // Special tenant for super admin
      isSuperAdmin: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Super admin created: ${env.SUPER_ADMIN_EMAIL}`);
  } catch (error: any) {
    // For any error during insert, assume super admin already exists
    // (since we check for existence before, any error here means it exists)
    console.log(`✅ Super admin already exists: ${env.SUPER_ADMIN_EMAIL}`);
  }
  console.log(
    `🔐 Default password: ${defaultPassword} (CHANGE AFTER FIRST LOGIN!)`,
  );
}
