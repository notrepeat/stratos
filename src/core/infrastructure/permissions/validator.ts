import { env } from '@config';
import { getSpiceDBClient } from './client';

export async function syncSpiceDBSchema(): Promise<void> {
  try {
    console.log('🔄 Checking SpiceDB connection...');

    const client = getSpiceDBClient();

    // Try a simple permission check to test connection
    await client.checkPermission('tenant:test', 'read', 'user:test-user');

    // Connection successful
    console.log('✅ SpiceDB connection validated');

    if (env.NODE_ENV === 'production') {
      console.log(
        '📝 In production, ensure schema is properly deployed to SpiceDB',
      );
    }
  } catch (error) {
    console.error('❌ SpiceDB validation failed:', error);

    if (env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.log(
        '⚠️  Continuing in development mode despite SpiceDB connection failure',
      );
    }
  }
}
