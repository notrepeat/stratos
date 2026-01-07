import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 26 }).primaryKey(), // ULID
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }),
    tenantId: varchar('tenant_id', { length: 26 }).notNull(),
    isSuperAdmin: boolean('is_super_admin').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    tenantIdIdx: index('idx_users_tenant_id').on(table.tenantId),
    superAdminIdx: index('idx_users_super_admin').on(table.isSuperAdmin),
    createdAtIdx: index('idx_users_created_at').on(table.createdAt),
  }),
);
