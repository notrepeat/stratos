import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
  };
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    // Set tenant context from authenticated user
    if (req.user?.tenantId) {
      // In a real implementation, this would set PostgreSQL session variables
      // For now, we'll store it in the request object for use in repositories
      (req as any).tenantContext = {
        tenantId: req.user.tenantId,
        userId: req.user.id,
      };
    }

    next();
  }
}
