import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';

export interface PermissionRequirement {
  resource: string;
  permission: string;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.get<PermissionRequirement[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requirements || requirements.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // This would be set by AuthGuard/JwtStrategy

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is super admin (bypass permissions)
    const isSuperAdmin = await this.permissionService.isSuperAdmin(user.id);
    if (isSuperAdmin) {
      return true;
    }

    // Check each permission requirement
    for (const requirement of requirements) {
      let resource = requirement.resource;
      const permission = requirement.permission;

      // Replace dynamic placeholders
      if (resource.includes(':userId')) {
        resource = resource.replace(':userId', user.id);
      }
      if (resource.includes(':tenantId') && user.tenantId) {
        resource = resource.replace(':tenantId', user.tenantId);
      }

      // Handle path parameters
      const params = request.params;
      if (resource.includes(':id') && params.id) {
        resource = resource.replace(':id', params.id);
      }
      if (resource.includes(':tenantId') && params.tenantId) {
        resource = resource.replace(':tenantId', params.tenantId);
      }
      if (resource.includes(':userId') && params.userId) {
        resource = resource.replace(':userId', params.userId);
      }

      const hasPermission = await this.permissionService.hasPermission(
        resource,
        permission,
        user.id,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Insufficient permissions: ${permission} on ${resource}`,
        );
      }
    }

    return true;
  }
}
