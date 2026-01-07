import { Injectable } from '@nestjs/common';
import {
  getSpiceDBClient,
  SpiceDBClient,
} from '../infrastructure/permissions/client';

export interface PermissionCheck {
  resource: string;
  permission: string;
  userId: string;
}

export interface RelationshipUpdate {
  resource: string;
  relation: string;
  subject: string;
}

@Injectable()
export class PermissionService {
  private client: SpiceDBClient = getSpiceDBClient();

  // Check if user has permission on resource
  async hasPermission(
    resource: string,
    permission: string,
    userId: string,
  ): Promise<boolean> {
    return this.client.checkPermission(resource, permission, `user:${userId}`);
  }

  // Check multiple permissions at once
  async hasPermissions(checks: PermissionCheck[]): Promise<boolean[]> {
    const results = await Promise.all(
      checks.map((check) =>
        this.hasPermission(check.resource, check.permission, check.userId),
      ),
    );
    return results;
  }

  // Tenant-specific permission checks
  async canManageTenant(tenantId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`tenant:${tenantId}`, 'manage', userId);
  }

  async canReadTenant(tenantId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`tenant:${tenantId}`, 'read', userId);
  }

  async canUpdateTenant(tenantId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`tenant:${tenantId}`, 'update', userId);
  }

  async canDeleteTenant(tenantId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`tenant:${tenantId}`, 'delete', userId);
  }

  // User-specific permission checks
  async canReadUser(
    userId: string,
    requestingUserId: string,
  ): Promise<boolean> {
    return this.hasPermission(`user:${userId}`, 'read', requestingUserId);
  }

  async canUpdateUser(
    userId: string,
    requestingUserId: string,
  ): Promise<boolean> {
    return this.hasPermission(`user:${userId}`, 'update', requestingUserId);
  }

  async canDeleteUser(
    userId: string,
    requestingUserId: string,
  ): Promise<boolean> {
    return this.hasPermission(`user:${userId}`, 'delete', requestingUserId);
  }

  // Billing-specific permission checks
  async canReadInvoice(invoiceId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`invoice:${invoiceId}`, 'read', userId);
  }

  async canUpdateInvoice(invoiceId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`invoice:${invoiceId}`, 'update', userId);
  }

  async canPayInvoice(invoiceId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`invoice:${invoiceId}`, 'pay', userId);
  }

  async canReadPayment(paymentId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`payment:${paymentId}`, 'read', userId);
  }

  async canRefundPayment(paymentId: string, userId: string): Promise<boolean> {
    return this.hasPermission(`payment:${paymentId}`, 'refund', userId);
  }

  // Relationship management
  async addUserToTenant(
    tenantId: string,
    userId: string,
    role: 'admin' | 'member' = 'member',
  ): Promise<void> {
    await this.client.writeRelationship(
      `tenant:${tenantId}`,
      role,
      `user:${userId}`,
    );
  }

  async removeUserFromTenant(tenantId: string, userId: string): Promise<void> {
    // Remove both admin and member relationships
    await Promise.all([
      this.client.deleteRelationship(
        `tenant:${tenantId}`,
        'admin',
        `user:${userId}`,
      ),
      this.client.deleteRelationship(
        `tenant:${tenantId}`,
        'member',
        `user:${userId}`,
      ),
    ]);
  }

  async makeUserTenantAdmin(tenantId: string, userId: string): Promise<void> {
    await this.client.writeRelationship(
      `tenant:${tenantId}`,
      'admin',
      `user:${userId}`,
    );
  }

  async removeTenantAdmin(tenantId: string, userId: string): Promise<void> {
    await this.client.deleteRelationship(
      `tenant:${tenantId}`,
      'admin',
      `user:${userId}`,
    );
  }

  // Super admin checks (bypass normal permissions)
  async isSuperAdmin(userId: string): Promise<boolean> {
    // In production, this would check SpiceDB super_admin relationship
    // For now, we'll check a simple flag or database field
    return userId === 'super-admin'; // This would be checked against user.isSuperAdmin
  }

  // Bulk permission checks for optimization
  async filterAccessibleResources(
    resources: string[],
    permission: string,
    userId: string,
  ): Promise<string[]> {
    const checks = resources.map((resource) => ({
      resource,
      permission,
      userId,
    }));

    const results = await this.hasPermissions(checks);

    return resources.filter((_, index) => results[index]);
  }

  // Get user permissions summary
  async getUserPermissions(userId: string): Promise<{
    isSuperAdmin: boolean;
    tenantRoles: Array<{ tenantId: string; role: string }>;
    accessibleResources: {
      tenants: string[];
      canManage: string[];
    };
  }> {
    const isSuperAdmin = await this.isSuperAdmin(userId);

    // In a real implementation, this would query SpiceDB for all relationships
    // For now, return mock data
    return {
      isSuperAdmin,
      tenantRoles: [], // Would be populated from SpiceDB query
      accessibleResources: {
        tenants: [], // Would be populated from SpiceDB query
        canManage: [], // Would be populated from SpiceDB query
      },
    };
  }
}
