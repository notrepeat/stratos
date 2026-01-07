import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../../modules/tenants/core/services/tenant.service';

export interface TenantRequest extends Request {
  tenantContext?: {
    tenantId: string;
    databaseName: string;
    domain: string;
    tenant: any; // Full tenant object
  };
}

@Injectable()
export class DomainTenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    try {
      const host = req.headers.host;

      if (!host) {
        throw new Error('Host header missing');
      }

      // Normalize domain (remove port for localhost)
      const domain = this.normalizeDomain(host);

      // Find tenant by domain
      const tenant = await this.tenantService.findByDomain(domain);

      if (!tenant) {
        // For development, allow localhost without tenant
        if (domain === 'localhost') {
          req.tenantContext = {
            tenantId: 'dev-tenant',
            databaseName: 'saas_dev',
            domain: 'localhost',
            tenant: null,
          };
          return next();
        }

        throw new Error(`Tenant not found for domain: ${domain}`);
      }

      // Set tenant context for the request
      req.tenantContext = {
        tenantId: tenant.id,
        databaseName: tenant.databaseName,
        domain: tenant.domain,
        tenant: tenant,
      };

      next();
    } catch (error) {
      // For API errors, we should throw proper exceptions
      // For now, pass through to next middleware
      next();
    }
  }

  private normalizeDomain(host: string): string {
    // Remove port number for localhost and other development hosts
    // localhost:3000 → localhost
    // cliente1.stratos.app:443 → cliente1.stratos.app

    const [domain] = host.split(':');
    return domain;
  }
}
