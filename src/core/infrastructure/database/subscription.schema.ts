import { pgTable, text, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    plan: text('plan', {
      enum: ['basic', 'pro', 'enterprise'],
    })
      .notNull()
      .default('basic'),
    status: text('status', {
      enum: ['active', 'inactive', 'cancelled'],
    })
      .notNull()
      .default('active'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    billingCycle: text('billing_cycle', {
      enum: ['monthly', 'yearly'],
    })
      .notNull()
      .default('monthly'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    nextBillingDate: timestamp('next_billing_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('subscriptions_tenant_idx').on(table.tenantId),
    statusIdx: index('subscriptions_status_idx').on(table.status),
    nextBillingIdx: index('subscriptions_next_billing_idx').on(
      table.nextBillingDate,
    ),
    createdAtIdx: index('subscriptions_created_at_idx').on(table.createdAt),
  }),
);
