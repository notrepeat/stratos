import { SetMetadata } from '@nestjs/common';
import { PermissionRequirement } from '../guards/permission.guard';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions on a route
 * @param requirements Array of permission requirements
 */
export const RequirePermissions = (
  ...requirements: PermissionRequirement[]
) => {
  return SetMetadata(PERMISSIONS_KEY, requirements);
};

/**
 * Decorator to require tenant admin permissions
 * @param tenantId Optional tenant ID, defaults to user's tenant
 */
export const RequireTenantAdmin = (tenantId?: string) => {
  const resource = tenantId ? `tenant:${tenantId}` : 'tenant::tenantId';
  return RequirePermissions({ resource, permission: 'manage' });
};

/**
 * Decorator to require tenant read permissions
 * @param tenantId Optional tenant ID, defaults to user's tenant
 */
export const RequireTenantRead = (tenantId?: string) => {
  const resource = tenantId ? `tenant:${tenantId}` : 'tenant::tenantId';
  return RequirePermissions({ resource, permission: 'read' });
};

/**
 * Decorator to require user self-management permissions
 */
export const RequireUserSelf = () => {
  return RequirePermissions({ resource: 'user::userId', permission: 'update' });
};

/**
 * Decorator to require billing management permissions
 * @param tenantId Optional tenant ID, defaults to user's tenant
 */
export const RequireBillingAccess = (tenantId?: string) => {
  const resource = tenantId ? `tenant:${tenantId}` : 'tenant::tenantId';
  return RequirePermissions({ resource, permission: 'manage_billing' });
};

/**
 * Decorator to require invoice management permissions
 * @param invoiceId Optional invoice ID from path params
 */
export const RequireInvoiceAccess = (invoiceId?: string) => {
  const resource = invoiceId ? `invoice:${invoiceId}` : 'invoice::id';
  return RequirePermissions({ resource, permission: 'read' });
};

/**
 * Decorator to require payment management permissions
 * @param paymentId Optional payment ID from path params
 */
export const RequirePaymentAccess = (paymentId?: string) => {
  const resource = paymentId ? `payment:${paymentId}` : 'payment::id';
  return RequirePermissions({ resource, permission: 'read' });
};

/**
 * Decorator to require super admin permissions (bypass all checks)
 */
export const RequireSuperAdmin = () => {
  return SetMetadata('requireSuperAdmin', true);
};
