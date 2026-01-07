import { Controller, Get, Inject } from '@nestjs/common';
import { TenantConnectionManager } from '../services/tenant-connection-manager.service';
import { STORAGE_GATEWAY } from '../infrastructure/storage/ports/storage.port';
import type { IStorageGateway } from '../infrastructure/storage/ports/storage.port';

@Controller('health')
export class HealthController {
  constructor(
    private readonly tenantConnectionManager: TenantConnectionManager,
    @Inject(STORAGE_GATEWAY)
    private readonly storageGateway: IStorageGateway,
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Stratos SaaS Backend',
    };
  }

  @Get('tenants')
  async getTenantsHealth() {
    const stats = this.tenantConnectionManager.getStats();
    const tenantHealth = [];

    // Check each tenant database connection
    for (const tenantKey of stats.tenantConnections) {
      const databaseName = tenantKey.replace('db_', '');
      try {
        // Try to get connection (this will test if DB is accessible)
        await this.tenantConnectionManager.getTenantConnection(databaseName);
        // If we get here, the connection is healthy

        tenantHealth.push({
          tenant: databaseName,
          status: 'healthy',
          connections: 'ok',
        });
      } catch (error) {
        tenantHealth.push({
          tenant: databaseName,
          status: 'unhealthy',
          error: (error as Error).message,
        });
      }
    }

    const healthyCount = tenantHealth.filter(
      (h) => h.status === 'healthy',
    ).length;
    const unhealthyCount = tenantHealth.filter(
      (h) => h.status === 'unhealthy',
    ).length;

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalTenants: stats.tenantConnections.length,
        healthy: healthyCount,
        unhealthy: unhealthyCount,
      },
      tenants: tenantHealth,
      mainConnection: stats.mainConnection,
    };
  }

  @Get('storage')
  async getStorageHealth() {
    try {
      // Test storage by attempting to get metadata of a test file
      // This assumes we have a health-check file in storage
      await this.storageGateway.getMetadata('health-check.txt', 'system');

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        storage: 'accessible',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  @Get('deep')
  async getDeepHealth() {
    const [tenantsHealth, storageHealth] = await Promise.all([
      this.getTenantsHealth(),
      this.getStorageHealth(),
    ]);

    const overallStatus =
      tenantsHealth.summary.unhealthy === 0 &&
      storageHealth.status === 'healthy'
        ? 'healthy'
        : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        tenants: tenantsHealth,
        storage: storageHealth,
      },
    };
  }
}
