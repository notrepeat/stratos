import { Module, Global } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../../config/env.config';
import { TenantDatabaseService } from '../../services/tenant-database.service';
import { TenantConnectionManager } from '../../services/tenant-connection-manager.service';

@Global()
@Module({
  providers: [
    TenantConnectionManager,
    TenantDatabaseService,
    {
      provide: 'DRIZZLE_DB',
      useFactory: (): NodePgDatabase => {
        const pool = new Pool({
          host: env.DB_HOST,
          port: env.DB_PORT,
          user: env.DB_USER,
          password: env.DB_PASSWORD,
          database: env.DB_NAME,
          // Connection pooling settings
          max: env.NODE_ENV === 'production' ? 20 : 10, // More connections in production
          min: 2, // Minimum connections
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000, // Increased timeout
          // Query timeout
          query_timeout: 30000,
          // Health check settings
          allowExitOnIdle: true,
        });

        // Add error handling for the pool
        pool.on('error', (err) => {
          console.error('Unexpected error on idle client', err);
        });

        pool.on('connect', () => {
          console.log('✅ New database connection established');
        });

        pool.on('remove', () => {
          console.log('🔌 Database connection removed from pool');
        });

        return drizzle(pool);
      },
    },
  ],
  exports: ['DRIZZLE_DB', TenantConnectionManager, TenantDatabaseService],
})
export class DatabaseModule {}
