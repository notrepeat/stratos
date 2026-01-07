import { Module, Global, MiddlewareConsumer } from '@nestjs/common';
import { PermissionService } from '../services/permission.service';
import { PermissionGuard } from '../guards/permission.guard';
import { PermissionsController } from '../controllers/permissions.controller';
import { TenantContextService } from '../services/tenant-context.service';
import { DomainTenantMiddleware } from '../middleware/domain-tenant.middleware';
import { AUTH_SERVICE_PROVIDER } from '../auth/adapters/auth.service.adapter';
import { TenantsModule } from '../../modules/tenants/tenants.module';

@Global()
@Module({
  imports: [TenantsModule], // Need TenantService for domain routing
  controllers: [PermissionsController],
  providers: [
    PermissionService,
    PermissionGuard,
    TenantContextService,
    AUTH_SERVICE_PROVIDER, // Provides the abstract auth service
  ],
  exports: [PermissionService, PermissionGuard, TenantContextService],
})
export class PermissionsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DomainTenantMiddleware).forRoutes('*');
  }
}
