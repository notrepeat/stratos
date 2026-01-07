export class Subscription {
  id!: string;
  tenantId!: string;
  plan!: 'basic' | 'pro' | 'enterprise';
  status!: 'active' | 'inactive' | 'cancelled';
  price!: number;
  currency!: string;
  billingCycle!: 'monthly' | 'yearly';
  startDate!: Date;
  endDate?: Date;
  nextBillingDate!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: Partial<Subscription>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static fromDatabase(data: any): Subscription {
    return new Subscription({
      id: data.id,
      tenantId: data.tenantId,
      plan: data.plan,
      status: data.status,
      price: data.price,
      currency: data.currency,
      billingCycle: data.billingCycle,
      startDate: data.startDate,
      endDate: data.endDate,
      nextBillingDate: data.nextBillingDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Business logic methods
  isActive(): boolean {
    return this.status === 'active';
  }

  canBill(): boolean {
    return this.isActive() && this.nextBillingDate <= new Date();
  }

  updateNextBillingDate(): void {
    const now = new Date();
    if (this.billingCycle === 'monthly') {
      this.nextBillingDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
      );
    } else {
      this.nextBillingDate = new Date(
        now.getFullYear() + 1,
        now.getMonth(),
        now.getDate(),
      );
    }
  }

  cancel(): void {
    this.status = 'cancelled';
    this.endDate = new Date();
    this.updatedAt = new Date();
  }
}
