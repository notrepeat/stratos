-- Row Level Security (RLS) Implementation for SaaS Multi-tenancy
-- This migration enables complete data isolation between tenants

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create function to get current tenant from session context
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN nullif(current_setting('app.current_tenant_id', TRUE), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user from session context
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN nullif(current_setting('app.current_user_id', TRUE), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants table policies (tenants can only see themselves, except super admin)
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL USING (
    id = current_tenant_id() OR
    current_user_id() = 'super-admin' OR
    current_tenant_id() IS NULL
  );

-- Users table policies
CREATE POLICY user_tenant_isolation_policy ON users
  FOR ALL USING (
    tenant_id = current_tenant_id() OR
    current_user_id() = 'super-admin' OR
    id = current_user_id()
  );

-- Sessions table policies
CREATE POLICY session_tenant_isolation_policy ON sessions
  FOR ALL USING (
    tenant_id = current_tenant_id() OR
    user_id = current_user_id() OR
    current_user_id() = 'super-admin'
  );

-- Invoices table policies
CREATE POLICY invoice_tenant_isolation_policy ON invoices
  FOR ALL USING (
    tenant_id = current_tenant_id() OR
    current_user_id() = 'super-admin'
  );

-- Payments table policies (through invoice relationship)
CREATE POLICY payment_tenant_isolation_policy ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = payments.invoice_id
      AND (invoices.tenant_id = current_tenant_id() OR current_user_id() = 'super-admin')
    )
  );

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_tenants_rls ON tenants(id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_rls ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_rls ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_rls ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_rls ON payments(invoice_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION current_tenant_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_id() TO PUBLIC;