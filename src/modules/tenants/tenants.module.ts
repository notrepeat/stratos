import { Module } from '@nestjs/common';
import { TenantService } from '@modules/tenants/core/services/tenant.service';
import { TenantRepositoryAdapter } from '@modules/tenants/infrastructure/adapters/tenant.repository.adapter';
import { TENANT_REPOSITORY } from '@modules/tenants/core/ports/tenant.repository.port';
import { TenantController } from './api/controllers/tenant.controller';
import { TenantConnectionManager } from '@core/services/tenant-connection-manager.service';

@Module({
  controllers: [TenantController],
  providers: [
    TenantService,
    TenantConnectionManager,
    {
      provide: TENANT_REPOSITORY,
      useClass: TenantRepositoryAdapter,
    },
  ],
  exports: [TenantService, TENANT_REPOSITORY],
})
export class TenantsModule {}
