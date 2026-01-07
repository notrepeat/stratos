import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from '../../core/services/permission.service';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import {
  RequireTenantAdmin,
  RequireSuperAdmin,
} from '../../core/decorators/permissions.decorator';

@Controller('permissions')
@UseGuards(AuthGuard, PermissionGuard)
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  // Get user permissions summary
  @Get('user/:userId')
  @RequireSuperAdmin() // Only super admins can check others' permissions
  async getUserPermissions(@Param('userId') userId: string) {
    const permissions = await this.permissionService.getUserPermissions(userId);
    return {
      success: true,
      data: permissions,
    };
  }

  // Get current user permissions
  @Get('me')
  async getMyPermissions() {
    // User info comes from AuthGuard
    const user = { id: 'current-user-id' }; // This would come from request.user
    const permissions = await this.permissionService.getUserPermissions(
      user.id,
    );
    return {
      success: true,
      data: permissions,
    };
  }

  // Add user to tenant
  @Post('tenants/:tenantId/users')
  @RequireTenantAdmin()
  async addUserToTenant(
    @Param('tenantId') tenantId: string,
    @Body() body: { userId: string; role?: 'admin' | 'member' },
  ) {
    const role = body.role || 'member';
    await this.permissionService.addUserToTenant(tenantId, body.userId, role);

    return {
      success: true,
      message: `User ${body.userId} added to tenant ${tenantId} as ${role}`,
    };
  }

  // Remove user from tenant
  @Delete('tenants/:tenantId/users/:userId')
  @RequireTenantAdmin()
  async removeUserFromTenant(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    await this.permissionService.removeUserFromTenant(tenantId, userId);

    return {
      success: true,
      message: `User ${userId} removed from tenant ${tenantId}`,
    };
  }

  // Make user tenant admin
  @Post('tenants/:tenantId/admins/:userId')
  @RequireTenantAdmin()
  async makeUserTenantAdmin(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    await this.permissionService.makeUserTenantAdmin(tenantId, userId);

    return {
      success: true,
      message: `User ${userId} is now admin of tenant ${tenantId}`,
    };
  }

  // Remove tenant admin privileges
  @Delete('tenants/:tenantId/admins/:userId')
  @RequireTenantAdmin()
  async removeTenantAdmin(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    await this.permissionService.removeTenantAdmin(tenantId, userId);

    return {
      success: true,
      message: `User ${userId} is no longer admin of tenant ${tenantId}`,
    };
  }

  // Check specific permission
  @Post('check')
  async checkPermission(
    @Body() body: { resource: string; permission: string; userId?: string },
  ) {
    const userId = body.userId || 'current-user-id'; // From request.user
    const hasPermission = await this.permissionService.hasPermission(
      body.resource,
      body.permission,
      userId,
    );

    return {
      success: true,
      data: {
        resource: body.resource,
        permission: body.permission,
        userId,
        hasPermission,
      },
    };
  }

  // Get accessible resources
  @Post('resources')
  async getAccessibleResources(
    @Body() body: { resources: string[]; permission: string; userId?: string },
  ) {
    const userId = body.userId || 'current-user-id'; // From request.user
    const accessibleResources =
      await this.permissionService.filterAccessibleResources(
        body.resources,
        body.permission,
        userId,
      );

    return {
      success: true,
      data: {
        requested: body.resources,
        accessible: accessibleResources,
        permission: body.permission,
        userId,
      },
    };
  }
}
