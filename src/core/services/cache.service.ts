import { Injectable } from '@nestjs/common';

// Simple in-memory cache for development
// In production, use Redis or similar
@Injectable()
export class CacheService {
  private cache = new Map<string, { data: any; expires: number }>();
  private defaultTTL = 300000; // 5 minutes in milliseconds

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache with automatic key generation
  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs: number = this.defaultTTL,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return factory().then((data) => {
      this.set(key, data, ttlMs);
      return data;
    });
  }

  // Cache keys for common patterns
  static keys = {
    tenant: (id: string) => `tenant:${id}`,
    user: (id: string) => `user:${id}`,
    tenantUsers: (tenantId: string) => `tenant:${tenantId}:users`,
    tenantInvoices: (tenantId: string) => `tenant:${tenantId}:invoices`,
    userPermissions: (userId: string) => `user:${userId}:permissions`,
  };
}
