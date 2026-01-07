import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantThrottlerService } from '../services/tenant-throttler.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
  tenantContext?: {
    tenantId: string;
    userId: string;
  };
}

@Injectable()
export class TenantThrottleGuard implements CanActivate {
  constructor(private readonly throttler: TenantThrottlerService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = request.tenantContext?.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new HttpException(
        'Tenant context not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Check rate limit (100 requests per minute per tenant)
    if (!this.throttler.canProceed(tenantId, 100, 60 * 1000)) {
      const usage = this.throttler.getUsage(tenantId);
      const resetIn = usage
        ? Math.ceil((usage.resetTime - Date.now()) / 1000)
        : 60;

      throw new HttpException(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded for tenant. Try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
