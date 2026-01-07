import { Injectable, Inject } from '@nestjs/common';
import type { IInvoiceRepository } from '../ports/invoice.repository.port';
import type { IPaymentRepository } from '../ports/payment.repository.port';
import { INVOICE_REPOSITORY } from '../ports/invoice.repository.port';
import { PAYMENT_REPOSITORY } from '../ports/payment.repository.port';
import { CacheService } from '@core/services/cache.service';
import { Invoice } from '../domain/invoice.entity';
import { Payment } from '../domain/payment.entity';
import {
  NotFoundException,
  ConflictException,
  ValidationException,
} from '@core/exceptions/app.exceptions';

@Injectable()
export class BillingService {
  private readonly MONTHLY_PRICE = 29.99;
  private readonly CURRENCY = 'USD';

  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly cacheService: CacheService,
  ) {}

  // Generate monthly invoice for a tenant
  async generateMonthlyInvoice(
    tenantId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
  ): Promise<Invoice> {
    // Check if invoice already exists for this period
    const existingInvoices =
      await this.invoiceRepository.findByTenantId(tenantId);
    const existingInvoice = existingInvoices.find(
      (invoice) =>
        invoice.billingPeriodStart.getTime() === billingPeriodStart.getTime() &&
        invoice.billingPeriodEnd.getTime() === billingPeriodEnd.getTime(),
    );

    if (existingInvoice) {
      throw new ConflictException(
        'Ya existe una factura para este período de facturación',
        {
          tenantId,
          billingPeriodStart,
          billingPeriodEnd,
        },
      );
    }

    // Calculate due date (30 days from billing period end)
    const dueDate = new Date(billingPeriodEnd);
    dueDate.setDate(dueDate.getDate() + 30);

    return this.invoiceRepository.create({
      tenantId,
      amount: this.MONTHLY_PRICE,
      currency: this.CURRENCY,
      billingPeriodStart,
      billingPeriodEnd,
      dueDate,
    });
  }

  // Process payment for an invoice
  async processPayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'other';
      transactionId?: string;
      notes?: string;
    },
  ): Promise<Payment> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Factura', invoiceId);
    }

    if (!invoice.canBePaid()) {
      throw new ValidationException('La factura no puede ser pagada');
    }

    if (paymentData.amount !== invoice.amount) {
      throw new Error('Payment amount must match invoice amount');
    }

    // Create payment
    const payment = await this.paymentRepository.create({
      invoiceId,
      amount: paymentData.amount,
      currency: this.CURRENCY,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: new Date(),
      transactionId: paymentData.transactionId,
      notes: paymentData.notes,
    });

    // Mark invoice as paid
    invoice.markAsPaid();
    await this.invoiceRepository.update(invoiceId, invoice);

    // Invalidate billing summary cache
    this.cacheService.delete(`billing:summary:${invoice.tenantId}`);

    return payment;
  }

  // Get all invoices for a tenant
  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.findById(id);
  }

  async getInvoicesByTenantId(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findByTenantId(tenantId);
  }

  // Get pending invoices for a tenant
  async getPendingInvoicesByTenantId(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findPendingByTenantId(tenantId);
  }

  // Get all payments for a tenant
  async getPaymentsByTenantId(tenantId: string): Promise<Payment[]> {
    return this.paymentRepository.findByTenantId(tenantId);
  }

  // Get payments for a specific invoice
  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return this.paymentRepository.findByInvoiceId(invoiceId);
  }

  // Get overdue invoices
  async getOverdueInvoices(): Promise<Invoice[]> {
    const overdueInvoices = await this.invoiceRepository.findOverdue();

    // Update status for invoices that became overdue
    const now = new Date();
    for (const invoice of overdueInvoices) {
      if (invoice.status === 'pending' && now > invoice.dueDate) {
        invoice.markAsOverdue();
        await this.invoiceRepository.update(invoice.id, invoice);
      }
    }

    return overdueInvoices;
  }

  // Cancel invoice
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.cancel();
    const updatedInvoice = await this.invoiceRepository.update(
      invoiceId,
      invoice,
    );

    // Invalidate billing summary cache
    this.cacheService.delete(`billing:summary:${invoice.tenantId}`);

    return updatedInvoice;
  }

  // Refund payment
  async refundPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.refund();
    return this.paymentRepository.update(paymentId, payment);
  }

  // Get billing summary for a tenant (with caching)
  async getBillingSummary(tenantId: string): Promise<{
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalPaid: number;
    totalPending: number;
  }> {
    const cacheKey = `billing:summary:${tenantId}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const invoices = await this.invoiceRepository.findByTenantId(tenantId);

        const summary = {
          totalInvoices: invoices.length,
          paidInvoices: invoices.filter((inv) => inv.isPaid()).length,
          pendingInvoices: invoices.filter((inv) => inv.status === 'pending')
            .length,
          overdueInvoices: invoices.filter((inv) => inv.status === 'overdue')
            .length,
          totalPaid: invoices
            .filter((inv) => inv.isPaid())
            .reduce((sum, inv) => sum + inv.amount, 0),
          totalPending: invoices
            .filter((inv) => !inv.isPaid() && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + inv.amount, 0),
        };

        return summary;
      },
      300000, // Cache for 5 minutes
    );
  }
}
