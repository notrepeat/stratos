export class Payment {
  id!: string;
  invoiceId!: string;
  amount!: number;
  currency!: string;
  paymentMethod!: 'stripe' | 'paypal' | 'bank_transfer' | 'other';
  paymentDate!: Date;
  status!: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId!: string | null;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: Partial<Payment>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static fromDatabase(data: any): Payment {
    return new Payment({
      id: data.id,
      invoiceId: data.invoiceId,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate,
      status: data.status,
      transactionId: data.transactionId,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Business logic methods
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isPending(): boolean {
    return this.status === 'pending';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  canBeRefunded(): boolean {
    return this.status === 'completed';
  }

  markAsCompleted(transactionId?: string): void {
    this.status = 'completed';
    if (transactionId) {
      this.transactionId = transactionId;
    }
    this.updatedAt = new Date();
  }

  markAsFailed(): void {
    if (this.status === 'completed') {
      throw new Error('Completed payments cannot be marked as failed');
    }
    this.status = 'failed';
    this.updatedAt = new Date();
  }

  refund(): void {
    if (!this.canBeRefunded()) {
      throw new Error('Payment cannot be refunded');
    }
    this.status = 'refunded';
    this.updatedAt = new Date();
  }

  getDisplayAmount(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
