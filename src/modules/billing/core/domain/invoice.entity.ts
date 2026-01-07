export class Invoice {
  id!: string;
  tenantId!: string;
  amount!: number;
  currency!: string;
  status!: 'pending' | 'paid' | 'overdue' | 'cancelled';
  billingPeriodStart!: Date;
  billingPeriodEnd!: Date;
  dueDate!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: Partial<Invoice>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static fromDatabase(data: any): Invoice {
    return new Invoice({
      id: data.id,
      tenantId: data.tenantId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      billingPeriodStart: data.billingPeriodStart,
      billingPeriodEnd: data.billingPeriodEnd,
      dueDate: data.dueDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Business logic methods
  canBePaid(): boolean {
    return this.status === 'pending' || this.status === 'overdue';
  }

  isOverdue(): boolean {
    return (
      this.status === 'overdue' ||
      (this.status === 'pending' && new Date() > this.dueDate)
    );
  }

  isPaid(): boolean {
    return this.status === 'paid';
  }

  markAsPaid(): void {
    if (!this.canBePaid()) {
      throw new Error('Invoice cannot be marked as paid');
    }
    this.status = 'paid';
    this.updatedAt = new Date();
  }

  markAsOverdue(): void {
    if (this.status !== 'pending') {
      throw new Error('Only pending invoices can be marked as overdue');
    }
    this.status = 'overdue';
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status === 'paid') {
      throw new Error('Paid invoices cannot be cancelled');
    }
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  getOutstandingAmount(): number {
    return this.isPaid() ? 0 : this.amount;
  }
}
