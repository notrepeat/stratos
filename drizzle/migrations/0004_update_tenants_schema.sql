-- Custom SQL migration file, put your code below! --

-- Add new columns for multi-tenant schema
ALTER TABLE "tenants" ADD COLUMN "domain" text;
ALTER TABLE "tenants" ADD COLUMN "database_name" text;
ALTER TABLE "tenants" ADD COLUMN "status" text NOT NULL DEFAULT 'active';
ALTER TABLE "tenants" ADD COLUMN "admin_email" text;
ALTER TABLE "tenants" ADD COLUMN "admin_name" text NOT NULL DEFAULT 'Admin';

-- Update existing tenants with default values
UPDATE "tenants" SET
  "domain" = "slug" || '.localhost',
  "database_name" = 'tenant_' || "slug",
  "admin_email" = 'admin@' || "slug" || '.localhost',
  "status" = "subscription_status";

-- Make new columns NOT NULL and UNIQUE after populating data
ALTER TABLE "tenants" ALTER COLUMN "domain" SET NOT NULL;
ALTER TABLE "tenants" ALTER COLUMN "database_name" SET NOT NULL;
ALTER TABLE "tenants" ALTER COLUMN "admin_email" SET NOT NULL;

-- Add unique constraints
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_domain_unique" UNIQUE ("domain");
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_database_name_unique" UNIQUE ("database_name");

-- Drop old columns
ALTER TABLE "tenants" DROP COLUMN "subscription_status";
ALTER TABLE "tenants" DROP COLUMN "subscription_plan";
ALTER TABLE "tenants" DROP COLUMN "subscription_start_date";
ALTER TABLE "tenants" DROP COLUMN "subscription_end_date";

-- Create indexes for new schema
CREATE INDEX "tenants_domain_idx" ON "tenants" USING btree ("domain");
CREATE INDEX "tenants_status_idx" ON "tenants" USING btree ("status");