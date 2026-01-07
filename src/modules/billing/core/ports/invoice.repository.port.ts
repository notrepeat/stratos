import { Invoice } from '../domain/invoice.entity';

export interface IInvoiceRepository {
  create(data: CreateInvoiceData): Promise<Invoice>;
  findById(id: string): Promise<Invoice | null>;
  findByTenantId(tenantId: string): Promise<Invoice[]>;
  findPendingByTenantId(tenantId: string): Promise<Invoice[]>;
  findOverdue(): Promise<Invoice[]>;
  update(id: string, invoice: Invoice): Promise<Invoice>;
  delete(id: string): Promise<void>;
}

export const INVOICE_REPOSITORY = Symbol('INVOICE_REPOSITORY');

export interface CreateInvoiceData {
  tenantId: string;
  amount: number;
  currency: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
}
