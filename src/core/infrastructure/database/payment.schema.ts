import { pgTable, text, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { invoices } from './invoice.schema';

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    invoiceId: text('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    paymentMethod: text('payment_method', {
      enum: ['stripe', 'paypal', 'bank_transfer', 'other'],
    }).notNull(),
    paymentDate: timestamp('payment_date').notNull(),
    status: text('status', {
      enum: ['pending', 'completed', 'failed', 'refunded'],
    })
      .notNull()
      .default('completed'),
    transactionId: text('transaction_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    invoiceIdx: index('payments_invoice_idx').on(table.invoiceId),
    statusIdx: index('payments_status_idx').on(table.status),
    paymentDateIdx: index('payments_payment_date_idx').on(table.paymentDate),
    createdAtIdx: index('payments_created_at_idx').on(table.createdAt),
  }),
);
