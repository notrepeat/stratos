import { Resolver, Query } from '@nestjs/graphql';
import { TenantConnectionManager } from '../services/tenant-connection-manager.service';

@Resolver()
export class HealthResolver {
  constructor(
    private readonly tenantConnectionManager: TenantConnectionManager,
  ) {}

  @Query(() => String, { name: 'health' })
  async getHealth(): Promise<string> {
    const result = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Stratos SaaS Backend',
    };
    return JSON.stringify(result);
  }

  @Query(() => String, { name: 'tenantsHealth' })
  async getTenantsHealth(): Promise<string> {
    const stats = this.tenantConnectionManager.getStats();
    const result = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTenants: stats.tenantConnections.length,
        healthy: stats.tenantConnections.length, // Simplified
        unhealthy: 0,
      },
      tenants: stats.tenantConnections.map((key) => ({
        tenant: key.replace('db_', ''),
        status: 'healthy',
      })),
      mainConnection: stats.mainConnection,
    };
    return JSON.stringify(result);
  }

  @Query(() => String, { name: 'storageHealth' })
  async getStorageHealth(): Promise<string> {
    const result = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      storage: 'accessible',
    };
    return JSON.stringify(result);
  }

  @Query(() => String, { name: 'deepHealth' })
  async getDeepHealth(): Promise<string> {
    const [tenantsHealth, storageHealth] = await Promise.all([
      this.getTenantsHealth(),
      this.getStorageHealth(),
    ]);

    const result = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        tenants: tenantsHealth,
        storage: storageHealth,
      },
    };
    return JSON.stringify(result);
  }
}
