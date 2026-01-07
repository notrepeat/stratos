import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';

export interface TenantContext {
  tenantId: string;
  userId: string;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  constructor(@Inject(REQUEST) private readonly request: any) {}

  getTenantContext(): TenantContext | null {
    return this.request.tenantContext || null;
  }

  getCurrentTenantId(): string | null {
    const context = this.getTenantContext();
    return context?.tenantId || null;
  }

  getCurrentUserId(): string | null {
    const context = this.getTenantContext();
    return context?.userId || null;
  }

  isSuperAdmin(): boolean {
    const context = this.getTenantContext();
    return context?.userId === 'super-admin' || false;
  }

  // For use in repositories - applies tenant filtering automatically
  getTenantFilter() {
    const tenantId = this.getCurrentTenantId();
    const isSuperAdmin = this.isSuperAdmin();

    return {
      tenantId,
      isSuperAdmin,
      shouldApplyTenantFilter: !isSuperAdmin && tenantId !== null,
    };
  }
}
