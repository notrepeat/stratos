import { Injectable } from '@nestjs/common';
import { IAuthService, AUTH_SERVICE } from '../ports/auth.port';

@Injectable()
export class AuthServiceAdapter implements IAuthService {
  // For now, simplified auth validation without SessionService dependency
  // This allows complete decoupling of PermissionsModule from AuthModule

  async validateToken(token: string): Promise<{
    userId: string;
    tenantId: string;
    isSuperAdmin?: boolean;
  } | null> {
    try {
      // Simplified token validation for decoupling
      // In production, this would validate against JWT or session store
      if (!token || token.length < 10) return null;

      // Parse token format: "user:{userId}:{tenantId}"
      const parts = token.split(':');
      if (parts.length >= 3 && parts[0] === 'user') {
        return {
          userId: parts[1],
          tenantId: parts[2],
          isSuperAdmin: parts[1] === 'super-admin',
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async createSession(
    userId: string,
    tenantId: string,
  ): Promise<{
    sessionId: string;
    token: string;
  }> {
    // Simplified session creation
    const sessionId = `session_${Date.now()}`;
    const token = `user:${userId}:${tenantId}`;

    return { sessionId, token };
  }

  async revokeSession(sessionId: string): Promise<void> {
    // Simplified session revocation
    console.log(`Revoking session: ${sessionId}`);
  }
}

// Export the adapter as the implementation
export const AUTH_SERVICE_PROVIDER = {
  provide: AUTH_SERVICE,
  useClass: AuthServiceAdapter,
};
