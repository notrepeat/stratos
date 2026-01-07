import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BillingService } from '../core/services/billing.service';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { Invoice, Payment, BillingSummary } from './billing.types';
import {
  GenerateInvoiceInput,
  ProcessPaymentInput,
  CancelInvoiceInput,
  RefundPaymentInput,
} from './billing.inputs';

@Resolver()
@UseGuards(AuthGuard)
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @Query(() => Invoice, { name: 'invoice' })
  async getInvoice(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Invoice> {
    const invoice = await this.billingService.getInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      billingPeriodStart: invoice.billingPeriodStart,
      billingPeriodEnd: invoice.billingPeriodEnd,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      outstandingAmount: invoice.getOutstandingAmount(),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  @Query(() => [Invoice], { name: 'invoices' })
  async getInvoices(@Args('tenantId') tenantId: string): Promise<Invoice[]> {
    const invoices = await this.billingService.getInvoicesByTenantId(tenantId);
    return invoices.map((invoice) => ({
      id: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      billingPeriodStart: invoice.billingPeriodStart,
      billingPeriodEnd: invoice.billingPeriodEnd,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      outstandingAmount: invoice.getOutstandingAmount(),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }));
  }

  @Query(() => [Invoice], { name: 'pendingInvoices' })
  async getPendingInvoices(
    @Args('tenantId') tenantId: string,
  ): Promise<Invoice[]> {
    const invoices =
      await this.billingService.getPendingInvoicesByTenantId(tenantId);
    return invoices.map((invoice) => ({
      id: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      billingPeriodStart: invoice.billingPeriodStart,
      billingPeriodEnd: invoice.billingPeriodEnd,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      outstandingAmount: invoice.getOutstandingAmount(),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }));
  }

  @Query(() => [Invoice], { name: 'overdueInvoices' })
  async getOverdueInvoices(): Promise<Invoice[]> {
    const invoices = await this.billingService.getOverdueInvoices();
    return invoices.map((invoice) => ({
      id: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: 'overdue',
      billingPeriodStart: invoice.billingPeriodStart,
      billingPeriodEnd: invoice.billingPeriodEnd,
      dueDate: invoice.dueDate,
      isOverdue: true,
      outstandingAmount: invoice.getOutstandingAmount(),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      daysOverdue: Math.floor(
        (new Date().getTime() - invoice.dueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    })) as any;
  }

  @Query(() => [Payment], { name: 'payments' })
  async getPayments(@Args('tenantId') tenantId: string): Promise<Payment[]> {
    const payments = await this.billingService.getPaymentsByTenantId(tenantId);
    return payments.map((payment) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      transactionId: payment.transactionId || undefined,
      displayAmount: parseFloat(payment.getDisplayAmount()),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));
  }

  @Query(() => [Payment], { name: 'invoicePayments' })
  async getInvoicePayments(
    @Args('invoiceId') invoiceId: string,
  ): Promise<Payment[]> {
    const payments =
      await this.billingService.getPaymentsByInvoiceId(invoiceId);
    return payments.map((payment) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      transactionId: payment.transactionId || undefined,
      displayAmount: parseFloat(payment.getDisplayAmount()),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));
  }

  @Query(() => BillingSummary, { name: 'billingSummary' })
  async getBillingSummary(
    @Args('tenantId') tenantId: string,
  ): Promise<BillingSummary> {
    const summary = await this.billingService.getBillingSummary(tenantId);
    return summary;
  }

  @Mutation(() => Invoice, { name: 'generateInvoice' })
  async generateInvoice(
    @Args('input') input: GenerateInvoiceInput,
  ): Promise<Invoice> {
    const invoice = await this.billingService.generateMonthlyInvoice(
      input.tenantId,
      new Date(input.billingPeriodStart),
      new Date(input.billingPeriodEnd),
    );

    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      billingPeriodStart: invoice.billingPeriodStart,
      billingPeriodEnd: invoice.billingPeriodEnd,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      outstandingAmount: invoice.getOutstandingAmount(),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  @Mutation(() => Payment, { name: 'processPayment' })
  async processPayment(
    @Args('input') input: ProcessPaymentInput,
  ): Promise<Payment> {
    const payment = await this.billingService.processPayment(input.invoiceId, {
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      transactionId: input.transactionId,
      notes: input.notes,
    });

    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      transactionId: payment.transactionId || undefined,
      displayAmount: parseFloat(payment.getDisplayAmount()),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  @Mutation(() => Invoice, { name: 'cancelInvoice' })
  async cancelInvoice(
    @Args('input') input: CancelInvoiceInput,
  ): Promise<Invoice> {
    const invoice = await this.billingService.cancelInvoice(input.id);

    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      billingPeriodStart: invoice.billingPeriodStart,
      billingPeriodEnd: invoice.billingPeriodEnd,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      outstandingAmount: invoice.getOutstandingAmount(),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  @Mutation(() => Payment, { name: 'refundPayment' })
  async refundPayment(
    @Args('input') input: RefundPaymentInput,
  ): Promise<Payment> {
    const payment = await this.billingService.refundPayment(input.id);

    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      transactionId: payment.transactionId || undefined,
      displayAmount: parseFloat(payment.getDisplayAmount()),
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
