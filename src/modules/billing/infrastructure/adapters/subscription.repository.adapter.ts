import { Injectable } from '@nestjs/common';
import { eq, and, lte } from 'drizzle-orm';
import { ulid } from 'ulid';
import {
  ISubscriptionRepository,
  CreateSubscriptionData,
} from '../../core/ports/subscription.repository.port';
import { subscriptions } from '@core/infrastructure/database/subscription.schema';
import { Subscription } from '../../core/domain/subscription.entity';
import { TenantDatabaseService } from '@core/services/tenant-database.service';

@Injectable()
export class SubscriptionRepositoryAdapter implements ISubscriptionRepository {
  constructor(private readonly tenantDatabaseService: TenantDatabaseService) {}

  async create(data: CreateSubscriptionData): Promise<Subscription> {
    const subscriptionId = ulid();
    const now = new Date();

    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .insert(subscriptions)
      .values({
        id: subscriptionId,
        tenantId: data.tenantId,
        plan: data.plan,
        status: 'active',
        price: data.price.toString(),
        currency: data.currency,
        billingCycle: data.billingCycle,
        startDate: data.startDate,
        nextBillingDate: data.nextBillingDate,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return Subscription.fromDatabase(result);
  }

  async findById(id: string): Promise<Subscription | null> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    return result ? Subscription.fromDatabase(result) : null;
  }

  async findByTenantId(tenantId: string): Promise<Subscription | null> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId));

    return result ? Subscription.fromDatabase(result) : null;
  }

  async findAll(): Promise<Subscription[]> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const results = await db.select().from(subscriptions);
    return results.map((result) => Subscription.fromDatabase(result));
  }

  async findActive(): Promise<Subscription[]> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const results = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    return results.map((result) => Subscription.fromDatabase(result));
  }

  async findDueForBilling(): Promise<Subscription[]> {
    const now = new Date();
    const db = await this.tenantDatabaseService.getTenantConnection();
    const results = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          lte(subscriptions.nextBillingDate, now),
        ),
      );
    return results.map((result) => Subscription.fromDatabase(result));
  }

  async update(id: string, subscription: Subscription): Promise<Subscription> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .update(subscriptions)
      .set({
        plan: subscription.plan,
        status: subscription.status,
        price: subscription.price.toString(),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();

    return Subscription.fromDatabase(result);
  }

  async delete(id: string): Promise<void> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  }
}
