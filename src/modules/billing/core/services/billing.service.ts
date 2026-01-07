import { Injectable, Inject } from '@nestjs/common';
import type { IInvoiceRepository } from '../ports/invoice.repository.port';
import type { IPaymentRepository } from '../ports/payment.repository.port';
import type { ISubscriptionRepository } from '../ports/subscription.repository.port';
import { INVOICE_REPOSITORY } from '../ports/invoice.repository.port';
import { PAYMENT_REPOSITORY } from '../ports/payment.repository.port';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription.repository.port';
import { CacheService } from '@core/services/cache.service';
import { Invoice } from '../domain/invoice.entity';
import { Payment } from '../domain/payment.entity';
import { Subscription } from '../domain/subscription.entity';
import {
  NotFoundException,
  ConflictException,
  ValidationException,
} from '@core/exceptions/app.exceptions';

@Injectable()
export class BillingService {
  private readonly CURRENCY = 'USD';

  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
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

    // Get subscription for pricing
    const subscription =
      await this.subscriptionRepository.findByTenantId(tenantId);
    if (!subscription) {
      throw new NotFoundException('Suscripción', tenantId);
    }

    // Calculate due date (30 days from billing period end)
    const dueDate = new Date(billingPeriodEnd);
    dueDate.setDate(dueDate.getDate() + 30);

    return this.invoiceRepository.create({
      tenantId,
      amount: subscription.price,
      currency: subscription.currency,
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

  // Subscription management
  async createSubscription(data: {
    tenantId: string;
    plan: 'basic' | 'pro' | 'enterprise';
    billingCycle: 'monthly' | 'yearly';
  }): Promise<Subscription> {
    const prices = {
      basic: { monthly: 9.99, yearly: 99.99 },
      pro: { monthly: 29.99, yearly: 299.99 },
      enterprise: { monthly: 99.99, yearly: 999.99 },
    };

    const price = prices[data.plan][data.billingCycle];
    const now = new Date();
    const nextBillingDate = new Date(now);

    if (data.billingCycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    return this.subscriptionRepository.create({
      tenantId: data.tenantId,
      plan: data.plan,
      price,
      currency: this.CURRENCY,
      billingCycle: data.billingCycle,
      startDate: now,
      nextBillingDate,
    });
  }

  async getSubscriptionByTenantId(
    tenantId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepository.findByTenantId(tenantId);
  }

  async updateSubscription(
    id: string,
    data: {
      plan?: 'basic' | 'pro' | 'enterprise';
      billingCycle?: 'monthly' | 'yearly';
    },
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundException('Suscripción', id);
    }

    if (data.plan) {
      subscription.plan = data.plan;
    }
    if (data.billingCycle) {
      subscription.billingCycle = data.billingCycle;
      subscription.updateNextBillingDate();
    }

    return this.subscriptionRepository.update(id, subscription);
  }

  async cancelSubscription(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundException('Suscripción', id);
    }

    subscription.cancel();
    return this.subscriptionRepository.update(id, subscription);
  }

  async generateInvoicesForDueSubscriptions(): Promise<Invoice[]> {
    const dueSubscriptions =
      await this.subscriptionRepository.findDueForBilling();
    const invoices: Invoice[] = [];

    for (const subscription of dueSubscriptions) {
      const billingPeriodStart = new Date(subscription.nextBillingDate);
      const billingPeriodEnd = new Date(subscription.nextBillingDate);

      if (subscription.billingCycle === 'monthly') {
        billingPeriodStart.setMonth(billingPeriodStart.getMonth() - 1);
      } else {
        billingPeriodStart.setFullYear(billingPeriodStart.getFullYear() - 1);
      }

      try {
        const invoice = await this.generateMonthlyInvoice(
          subscription.tenantId,
          billingPeriodStart,
          billingPeriodEnd,
        );
        invoices.push(invoice);

        // Update next billing date
        subscription.updateNextBillingDate();
        await this.subscriptionRepository.update(subscription.id, subscription);
      } catch (error) {
        // Log error but continue with other subscriptions
        console.error(
          `Failed to generate invoice for tenant ${subscription.tenantId}:`,
          error,
        );
      }
    }

    return invoices;
  }
}
