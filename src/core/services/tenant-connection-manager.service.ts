import { Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@config';
import { initializeTenantDatabase } from '../infrastructure/database/tenant-initializer';

export interface TenantConnection {
  database: NodePgDatabase;
  pool: Pool;
  lastUsed: Date;
}

@Injectable()
export class TenantConnectionManager {
  private connections = new Map<string, TenantConnection>();
  private mainConnection: TenantConnection | null = null;

  constructor() {
    // Initialize main connection for tenant metadata
    this.initializeMainConnection();
  }

  /**
   * Get connection for a specific tenant database
   */
  async getTenantConnection(databaseName: string): Promise<NodePgDatabase> {
    const cacheKey = `db_${databaseName}`;

    // Check cache first
    if (this.connections.has(cacheKey)) {
      const connection = this.connections.get(cacheKey)!;
      connection.lastUsed = new Date();
      return connection.database;
    }

    // Create new connection
    const connection = await this.createTenantConnection(databaseName);
    this.connections.set(cacheKey, connection);

    return connection.database;
  }

  /**
   * Get main connection (for tenant metadata)
   */
  getMainConnection(): NodePgDatabase {
    if (!this.mainConnection) {
      throw new Error('Main connection not initialized');
    }
    this.mainConnection.lastUsed = new Date();
    return this.mainConnection.database;
  }

  /**
   * Initialize main database connection
   */
  private initializeMainConnection(): void {
    const pool = new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME, // Main database
      max: env.TENANT_DB_MAX_CONNECTIONS,
      idleTimeoutMillis: env.TENANT_DB_IDLE_TIMEOUT,
    });

    const database = drizzle(pool);

    this.mainConnection = {
      database,
      pool,
      lastUsed: new Date(),
    };

    // Handle connection errors
    pool.on('error', (err) => {
      console.error('Main database connection error:', err);
    });

    pool.on('connect', () => {
      console.log('✅ Main database connection established');
    });
  }

  /**
   * Create connection for specific tenant database
   */
  private async createTenantConnection(
    databaseName: string,
  ): Promise<TenantConnection> {
    const pool = new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: databaseName, // Connect to specific tenant database
      max: 10, // Smaller pool per tenant
      idleTimeoutMillis: env.TENANT_DB_IDLE_TIMEOUT,
    });

    const database = drizzle(pool);

    const connection: TenantConnection = {
      database,
      pool,
      lastUsed: new Date(),
    };

    // Handle connection errors
    pool.on('error', (err) => {
      console.error(`Tenant database ${databaseName} connection error:`, err);
    });

    pool.on('connect', () => {
      console.log(`✅ Tenant database ${databaseName} connection established`);
    });

    return connection;
  }

  /**
   * Cleanup idle connections (called by cron job)
   */
  cleanupIdleConnections(maxIdleTime: number = 30 * 60 * 1000): void {
    // 30 minutes
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [key, connection] of this.connections) {
      if (now - connection.lastUsed.getTime() > maxIdleTime) {
        connection.pool.end();
        toRemove.push(key);
      }
    }

    toRemove.forEach((key) => this.connections.delete(key));

    if (toRemove.length > 0) {
      console.log(`🧹 Cleaned up ${toRemove.length} idle tenant connections`);
    }
  }

  /**
   * Create a new physical database for a tenant
   */
  async createTenantDatabase(databaseName: string): Promise<void> {
    const rootPool = new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_ROOT_USER,
      password: env.DB_ROOT_PASSWORD,
      database: 'postgres', // Connect to default DB to create new DB
    });

    try {
      console.log(`🏗️ Creating tenant database: ${databaseName}`);

      // Create the database
      await rootPool.query(`CREATE DATABASE "${databaseName}"`);

      console.log(`✅ Tenant database created: ${databaseName}`);

      // Initialize the database with tables
      await initializeTenantDatabase(databaseName);

      console.log(`✅ Tenant database initialized: ${databaseName}`);
    } catch (error) {
      console.error(
        `❌ Failed to create tenant database ${databaseName}:`,
        error,
      );
      throw new Error(`Failed to create tenant database: ${databaseName}`);
    } finally {
      await rootPool.end();
    }
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      mainConnection: this.mainConnection ? 'connected' : 'disconnected',
      activeTenantConnections: this.connections.size,
      tenantConnections: Array.from(this.connections.keys()),
    };
  }
}
