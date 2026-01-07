import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BillingService } from '@modules/billing/core/services/billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // Generate monthly invoice for a tenant
  @Post('invoices/generate/:tenantId')
  async generateMonthlyInvoice(
    @Param('tenantId') tenantId: string,
    @Body() body: { billingPeriodStart: string; billingPeriodEnd: string },
  ) {
    const billingPeriodStart = new Date(body.billingPeriodStart);
    const billingPeriodEnd = new Date(body.billingPeriodEnd);

    const invoice = await this.billingService.generateMonthlyInvoice(
      tenantId,
      billingPeriodStart,
      billingPeriodEnd,
    );

    return {
      success: true,
      data: {
        id: invoice.id,
        tenantId: invoice.tenantId,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        billingPeriodStart: invoice.billingPeriodStart,
        billingPeriodEnd: invoice.billingPeriodEnd,
        dueDate: invoice.dueDate,
      },
    };
  }

  // Get all invoices for a tenant
  @Get('invoices/tenant/:tenantId')
  async getInvoicesByTenantId(@Param('tenantId') tenantId: string) {
    const invoices = await this.billingService.getInvoicesByTenantId(tenantId);
    return invoices.map((invoice: any) => ({
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
    }));
  }

  // Get pending invoices for a tenant
  @Get('invoices/tenant/:tenantId/pending')
  async getPendingInvoicesByTenantId(@Param('tenantId') tenantId: string) {
    const invoices =
      await this.billingService.getPendingInvoicesByTenantId(tenantId);
    return invoices.map((invoice: any) => ({
      id: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
    }));
  }

  // Get invoice by ID
  @Get('invoices/:id')
  async getInvoiceById(@Param('id') id: string) {
    const invoice = await this.billingService.getInvoiceById(id);

    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
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
    };
  }

  // Process payment for an invoice
  @Post('payments')
  async processPayment(
    @Body()
    body: {
      invoiceId: string;
      amount: number;
      paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'other';
      transactionId?: string;
      notes?: string;
    },
  ) {
    const payment = await this.billingService.processPayment(body.invoiceId, {
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      transactionId: body.transactionId,
      notes: body.notes,
    });

    return {
      success: true,
      data: {
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        status: payment.status,
        transactionId: payment.transactionId,
      },
    };
  }

  // Get all payments for a tenant
  @Get('payments/tenant/:tenantId')
  async getPaymentsByTenantId(@Param('tenantId') tenantId: string) {
    const payments = await this.billingService.getPaymentsByTenantId(tenantId);
    return payments.map((payment: any) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      transactionId: payment.transactionId,
      displayAmount: payment.getDisplayAmount(),
    }));
  }

  // Get payments for a specific invoice
  @Get('payments/invoice/:invoiceId')
  async getPaymentsByInvoiceId(@Param('invoiceId') invoiceId: string) {
    const payments =
      await this.billingService.getPaymentsByInvoiceId(invoiceId);
    return payments.map((payment: any) => ({
      id: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      transactionId: payment.transactionId,
    }));
  }

  // Get billing summary for a tenant
  @Get('summary/:tenantId')
  async getBillingSummary(@Param('tenantId') tenantId: string) {
    const summary = await this.billingService.getBillingSummary(tenantId);
    return {
      success: true,
      data: summary,
    };
  }

  // Cancel invoice
  @Post('invoices/:id/cancel')
  async cancelInvoice(@Param('id') id: string) {
    const invoice = await this.billingService.cancelInvoice(id);
    return {
      success: true,
      message: 'Invoice cancelled successfully',
      data: {
        id: invoice.id,
        status: invoice.status,
      },
    };
  }

  // Refund payment
  @Post('payments/:id/refund')
  async refundPayment(@Param('id') id: string) {
    const payment = await this.billingService.refundPayment(id);
    return {
      success: true,
      message: 'Payment refunded successfully',
      data: {
        id: payment.id,
        status: payment.status,
      },
    };
  }

  // Get overdue invoices (admin endpoint)
  @Get('invoices/overdue')
  async getOverdueInvoices() {
    const invoices = await this.billingService.getOverdueInvoices();
    return invoices.map((invoice: any) => ({
      id: invoice.id,
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      daysOverdue: Math.floor(
        (new Date().getTime() - invoice.dueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }
}
