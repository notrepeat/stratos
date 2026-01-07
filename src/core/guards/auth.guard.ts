import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  // Simplified auth guard for development
  // In production, this would validate JWT tokens or session tokens

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // For development, we'll accept any non-empty token
    // In production, this would validate against database or JWT
    if (!token || token.length < 10) {
      throw new UnauthorizedException('Invalid token');
    }

    // Extract user info from token (simplified for development)
    // In production, this would decode JWT or validate session
    const parts = token.split(':');
    if (parts.length >= 2) {
      request.user = {
        id: parts[1], // Assume format: "user:{userId}"
        tenantId: parts[2] || 'default', // Assume format: "user:{userId}:{tenantId}"
      };
    } else {
      // Default user for testing
      request.user = {
        id: 'test-user',
        tenantId: 'default',
      };
    }

    // Set tenant context for RLS
    (request as any).tenantContext = {
      tenantId: request.user.tenantId,
      userId: request.user.id,
    };

    return true;
  }
}
