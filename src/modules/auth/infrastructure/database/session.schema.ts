import {
  pgTable,
  varchar,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 26 }).primaryKey(), // ULID
    userId: varchar('user_id', { length: 26 }).notNull(),
    tenantId: varchar('tenant_id', { length: 26 }).notNull(),
    token: varchar('token', { length: 64 }).notNull().unique(), // Token opaco
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    isRevoked: boolean('is_revoked').notNull().default(false),
  },
  (table) => ({
    tokenIdx: index('idx_sessions_token').on(table.token),
    userIdIdx: index('idx_sessions_user_id').on(table.userId),
    tenantIdIdx: index('idx_sessions_tenant_id').on(table.tenantId),
    expiresAtIdx: index('idx_sessions_expires_at').on(table.expiresAt),
    isRevokedIdx: index('idx_sessions_is_revoked').on(table.isRevoked),
  }),
);
