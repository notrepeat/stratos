import { Injectable } from '@nestjs/common';

interface ThrottleRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class TenantThrottlerService {
  private readonly throttleStorage = new Map<string, ThrottleRecord>();

  // Default limits: 100 requests per minute per tenant
  private readonly DEFAULT_LIMIT = 100;
  private readonly DEFAULT_TTL = 60 * 1000; // 1 minute

  /**
   * Check if tenant can make a request
   */
  canProceed(tenantId: string, limit?: number, ttl?: number): boolean {
    const key = `tenant_${tenantId}`;
    const now = Date.now();
    const actualLimit = limit || this.DEFAULT_LIMIT;
    const actualTtl = ttl || this.DEFAULT_TTL;

    const record = this.throttleStorage.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.throttleStorage.set(key, {
        count: 1,
        resetTime: now + actualTtl,
      });
      return true;
    }

    if (record.count >= actualLimit) {
      return false; // Limit exceeded
    }

    // Increment counter
    record.count++;
    this.throttleStorage.set(key, record);
    return true;
  }

  /**
   * Get current usage for tenant
   */
  getUsage(
    tenantId: string,
  ): { current: number; limit: number; resetTime: number } | null {
    const record = this.throttleStorage.get(`tenant_${tenantId}`);
    if (!record) return null;

    return {
      current: record.count,
      limit: this.DEFAULT_LIMIT,
      resetTime: record.resetTime,
    };
  }

  /**
   * Clean up expired records (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, record] of this.throttleStorage) {
      if (now > record.resetTime) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.throttleStorage.delete(key));

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} expired throttle records`);
    }
  }
}
