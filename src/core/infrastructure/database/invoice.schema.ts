import { pgTable, text, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';

export const invoices = pgTable(
  'invoices',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    status: text('status', {
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
    })
      .notNull()
      .default('pending'),
    billingPeriodStart: timestamp('billing_period_start').notNull(),
    billingPeriodEnd: timestamp('billing_period_end').notNull(),
    dueDate: timestamp('due_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('invoices_tenant_idx').on(table.tenantId),
    statusIdx: index('invoices_status_idx').on(table.status),
    dueDateIdx: index('invoices_due_date_idx').on(table.dueDate),
    createdAtIdx: index('invoices_created_at_idx').on(table.createdAt),
    billingPeriodIdx: index('invoices_billing_period_idx').on(
      table.billingPeriodStart,
      table.billingPeriodEnd,
    ),
  }),
);
