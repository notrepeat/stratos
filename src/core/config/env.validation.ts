import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3003),

  // Database
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_ROOT_USER: z.string().default('postgres'),
  DB_ROOT_PASSWORD: z.string(),

  // SpiceDB
  SPICEDB_ENDPOINT: z.string().url(),
  SPICEDB_TOKEN: z.string().optional(),

  // AWS S3
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1), // Relaxed for development
  AWS_SECRET_ACCESS_KEY: z.string().min(1), // Relaxed for development
  AWS_S3_BUCKET: z.string(),
  AWS_ENDPOINT: z.string().optional(), // For local S3 compatible services

  // Sessions (tokens opacos en DB)
  SESSION_DURATION_HOURS: z.coerce.number().default(168), // 7 días

  // Multi-tenancy Configuration
  MULTI_TENANCY_ENABLED: z.coerce.boolean().default(true),
  TENANT_DB_PREFIX: z.string().default('saas_tenant_'),
  TENANT_DB_MAX_CONNECTIONS: z.coerce.number().default(20),
  TENANT_DB_IDLE_TIMEOUT: z.coerce.number().default(60000),

  // Super Admin Configuration (REQUIRED - no defaults allowed)
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_NAME: z.string().min(1),
  SUPER_ADMIN_DEFAULT_PASSWORD: z.string().min(8),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('🚨 CRITICAL: Environment validation failed!');
      console.error('Missing or invalid environment variables:');

      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        const message = issue.message;
        console.error(`  ❌ ${path}: ${message}`);
      });

      console.error('');
      console.error('💡 SOLUTION: Add the missing variables to your .env file');
      console.error('   Copy from .env.example and fill in the actual values');
      console.error('');

      throw new Error(
        `Environment validation failed. ${error.issues.length} variables are missing or invalid.`,
      );
    }
    throw error;
  }
}
