import { Injectable } from '@nestjs/common';
import { eq, and, gt } from 'drizzle-orm';
import { ulid } from 'ulid';
import { randomBytes } from 'crypto';
import { sessions } from '../../infrastructure/database/session.schema';
import { env } from '../../../../core/config/env.config';
import { TenantDatabaseService } from '../../../../core/services/tenant-database.service';

@Injectable()
export class SessionService {
  constructor(private readonly tenantDatabaseService: TenantDatabaseService) {}

  async createSession(data: {
    userId: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    const sessionId = ulid();

    // Token opaco aleatorio (64 caracteres hex = 32 bytes)
    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + env.SESSION_DURATION_HOURS);

    const db = await this.tenantDatabaseService.getTenantConnection();
    await db.insert(sessions).values({
      id: sessionId,
      userId: data.userId,
      tenantId: data.tenantId,
      token,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt,
      isRevoked: false,
    });

    return token; // Este token se envía al cliente
  }

  async validateSession(token: string): Promise<{
    userId: string;
    tenantId: string;
  } | null> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          eq(sessions.isRevoked, false),
          gt(sessions.expiresAt, new Date()),
        ),
      );

    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      tenantId: session.tenantId,
    };
  }

  async revokeSession(token: string): Promise<void> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.token, token));
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.userId, userId));
  }

  async cleanupExpiredSessions(): Promise<void> {
    // Llamar esto desde un cron job
    const db = await this.tenantDatabaseService.getTenantConnection();
    await db.delete(sessions).where(gt(sessions.expiresAt, new Date()));
  }
}
