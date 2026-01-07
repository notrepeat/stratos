import { Payment } from '../domain/payment.entity';

export interface IPaymentRepository {
  create(data: CreatePaymentData): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  findByTenantId(tenantId: string): Promise<Payment[]>;
  update(id: string, payment: Payment): Promise<Payment>;
  delete(id: string): Promise<void>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface CreatePaymentData {
  invoiceId: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'other';
  paymentDate: Date;
  transactionId?: string;
  notes?: string;
}
