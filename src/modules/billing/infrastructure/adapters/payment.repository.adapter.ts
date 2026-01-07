import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import {
  IPaymentRepository,
  CreatePaymentData,
} from '../../core/ports/payment.repository.port';
import { payments } from '../../../../core/infrastructure/database/payment.schema';
import { invoices } from '../../../../core/infrastructure/database/invoice.schema';
import { Payment } from '../../core/domain/payment.entity';
import { TenantDatabaseService } from '../../../../core/services/tenant-database.service';

@Injectable()
export class PaymentRepositoryAdapter implements IPaymentRepository {
  constructor(private readonly tenantDatabaseService: TenantDatabaseService) {}

  async create(data: CreatePaymentData): Promise<Payment> {
    const paymentId = ulid();
    const now = new Date();

    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .insert(payments)
      .values({
        id: paymentId,
        invoiceId: data.invoiceId,
        amount: data.amount.toString(),
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        status: 'completed',
        transactionId: data.transactionId || null,
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return Payment.fromDatabase(result);
  }

  async findById(id: string): Promise<Payment | null> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));

    return result ? Payment.fromDatabase(result) : null;
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));
    return results.map((result) => Payment.fromDatabase(result));
  }

  async findByTenantId(tenantId: string): Promise<Payment[]> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const results = await db
      .select()
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(eq(invoices.tenantId, tenantId));

    return results.map(({ payments: paymentData }) =>
      Payment.fromDatabase(paymentData),
    );
  }

  async update(id: string, payment: Payment): Promise<Payment> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .update(payments)
      .set({
        status: payment.status,
        transactionId: payment.transactionId,
        notes: payment.notes,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();

    return Payment.fromDatabase(result);
  }

  async delete(id: string): Promise<void> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    await db.delete(payments).where(eq(payments.id, id));
  }
}
