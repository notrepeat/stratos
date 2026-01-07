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

  // Limits to prevent connection pool leaks
  private readonly MAX_TENANT_CONNECTIONS = 50; // Max 50 tenants with active connections
  private readonly MAX_CONNECTIONS_PER_TENANT = 10; // Max 10 connections per tenant
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // LRU tracking for eviction
  private connectionOrder: string[] = [];

  constructor() {
    // Initialize main connection for tenant metadata
    this.initializeMainConnection();

    // Start cleanup interval (every 5 minutes)
    setInterval(
      () => {
        this.cleanupIdleConnections();
      },
      5 * 60 * 1000,
    );
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

      // Update LRU order
      this.updateLRUOrder(cacheKey);
      return connection.database;
    }

    // Check if we need to evict connections (LRU)
    if (this.connections.size >= this.MAX_TENANT_CONNECTIONS) {
      await this.evictLRUConnection();
    }

    // Create new connection
    const connection = await this.createTenantConnection(databaseName);
    this.connections.set(cacheKey, connection);

    // Add to LRU order
    this.connectionOrder.push(cacheKey);

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
      max: this.MAX_CONNECTIONS_PER_TENANT, // Enforce limit per tenant
      idleTimeoutMillis: this.IDLE_TIMEOUT,
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
   * Update LRU order when connection is accessed
   */
  private updateLRUOrder(cacheKey: string): void {
    const index = this.connectionOrder.indexOf(cacheKey);
    if (index > -1) {
      // Move to end (most recently used)
      this.connectionOrder.splice(index, 1);
      this.connectionOrder.push(cacheKey);
    }
  }

  /**
   * Evict least recently used connection when limit is reached
   */
  private async evictLRUConnection(): Promise<void> {
    if (this.connectionOrder.length === 0) return;

    const lruKey = this.connectionOrder.shift()!; // Remove from front (LRU)
    const connection = this.connections.get(lruKey);

    if (connection) {
      console.log(`🗑️ Evicting LRU connection: ${lruKey}`);
      await connection.pool.end();
      this.connections.delete(lruKey);
    }
  }

  /**
   * Cleanup idle connections (called automatically every 5 minutes)
   */
  cleanupIdleConnections(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [key, connection] of this.connections) {
      if (now - connection.lastUsed.getTime() > this.IDLE_TIMEOUT) {
        connection.pool.end();
        toRemove.push(key);
      }
    }

    // Remove from LRU order as well
    toRemove.forEach((key) => {
      const index = this.connectionOrder.indexOf(key);
      if (index > -1) {
        this.connectionOrder.splice(index, 1);
      }
      this.connections.delete(key);
    });

    if (toRemove.length > 0) {
      console.log(`🧹 Cleaned up ${toRemove.length} idle tenant connections`);
    }
  }

  /**
   * Graceful shutdown - close all connections
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down tenant connection manager...');

    // Close all tenant connections
    const closePromises = Array.from(this.connections.values()).map(
      (connection) => connection.pool.end(),
    );

    await Promise.all(closePromises);
    this.connections.clear();
    this.connectionOrder.length = 0;

    // Close main connection
    if (this.mainConnection) {
      await this.mainConnection.pool.end();
      this.mainConnection = null;
    }

    console.log('✅ All database connections closed');
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
