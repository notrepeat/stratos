export interface IAuthService {
  validateToken(token: string): Promise<{
    userId: string;
    tenantId: string;
    isSuperAdmin?: boolean;
  } | null>;

  createSession(
    userId: string,
    tenantId: string,
  ): Promise<{
    sessionId: string;
    token: string;
  }>;

  revokeSession(sessionId: string): Promise<void>;
}

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');
