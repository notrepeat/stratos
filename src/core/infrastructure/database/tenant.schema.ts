import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';

export const tenants = pgTable(
  'tenants',
  {
    id: text('id').primaryKey(), // ULID interno (no expuesto)
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    domain: text('domain').notNull().unique(), // Routing principal (único)
    databaseName: text('database_name').notNull().unique(), // DB física asignada
    status: text('status').notNull().default('active'),
    adminEmail: text('admin_email').notNull(),
    adminName: text('admin_name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    domainIdx: index('tenants_domain_idx').on(table.domain),
    statusIdx: index('tenants_status_idx').on(table.status),
    createdAtIdx: index('tenants_created_at_idx').on(table.createdAt),
  }),
);
