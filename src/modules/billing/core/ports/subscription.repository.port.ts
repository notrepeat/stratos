import { Subscription } from '../domain/subscription.entity';

export interface ISubscriptionRepository {
  create(data: CreateSubscriptionData): Promise<Subscription>;
  findById(id: string): Promise<Subscription | null>;
  findByTenantId(tenantId: string): Promise<Subscription | null>;
  findAll(): Promise<Subscription[]>;
  findActive(): Promise<Subscription[]>;
  findDueForBilling(): Promise<Subscription[]>;
  update(id: string, subscription: Subscription): Promise<Subscription>;
  delete(id: string): Promise<void>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');

export interface CreateSubscriptionData {
  tenantId: string;
  plan: 'basic' | 'pro' | 'enterprise';
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  startDate: Date;
  nextBillingDate: Date;
}
