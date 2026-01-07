import { Injectable } from '@nestjs/common';
import { eq, and, lt } from 'drizzle-orm';
import { ulid } from 'ulid';
import {
  IInvoiceRepository,
  CreateInvoiceData,
} from '../../core/ports/invoice.repository.port';
import { invoices } from '../../../../core/infrastructure/database/invoice.schema';
import { Invoice } from '../../core/domain/invoice.entity';
import { TenantDatabaseService } from '../../../../core/services/tenant-database.service';

@Injectable()
export class InvoiceRepositoryAdapter implements IInvoiceRepository {
  constructor(private readonly tenantDatabaseService: TenantDatabaseService) {}

  async create(data: CreateInvoiceData): Promise<Invoice> {
    const invoiceId = ulid();
    const now = new Date();

    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .insert(invoices)
      .values({
        id: invoiceId,
        tenantId: data.tenantId,
        amount: data.amount.toString(),
        currency: data.currency,
        status: 'pending',
        billingPeriodStart: data.billingPeriodStart,
        billingPeriodEnd: data.billingPeriodEnd,
        dueDate: data.dueDate,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return Invoice.fromDatabase(result);
  }

  async findById(id: string): Promise<Invoice | null> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));

    return result ? Invoice.fromDatabase(result) : null;
  }

  async findByTenantId(tenantId: string): Promise<Invoice[]> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const results = await db
      .select()
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId));
    return results.map((result) => Invoice.fromDatabase(result));
  }

  async findPendingByTenantId(tenantId: string): Promise<Invoice[]> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const results = await db
      .select()
      .from(invoices)
      .where(
        and(eq(invoices.tenantId, tenantId), eq(invoices.status, 'pending')),
      );
    return results.map((result) => Invoice.fromDatabase(result));
  }

  async findOverdue(): Promise<Invoice[]> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const now = new Date();
    const results = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.status, 'pending'), lt(invoices.dueDate, now)));
    return results.map((result) => Invoice.fromDatabase(result));
  }

  async update(id: string, invoice: Invoice): Promise<Invoice> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .update(invoices)
      .set({
        status: invoice.status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    return Invoice.fromDatabase(result);
  }

  async delete(id: string): Promise<void> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    await db.delete(invoices).where(eq(invoices.id, id));
  }
}
