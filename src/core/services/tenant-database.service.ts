import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { TenantConnectionManager } from './tenant-connection-manager.service';
import type { TenantRequest } from '../middleware/domain-tenant.middleware';

@Injectable({ scope: Scope.REQUEST })
export class TenantDatabaseService {
  constructor(
    @Inject(REQUEST) private readonly request: TenantRequest,
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  /**
   * Get the database connection for the current tenant
   */
  async getTenantConnection(): Promise<NodePgDatabase> {
    const tenantContext = this.request.tenantContext;

    if (!tenantContext) {
      throw new Error('No tenant context found in request');
    }

    return this.connectionManager.getTenantConnection(
      tenantContext.databaseName,
    );
  }

  /**
   * Get tenant context for the current request
   */
  getTenantContext() {
    return this.request.tenantContext;
  }
}
