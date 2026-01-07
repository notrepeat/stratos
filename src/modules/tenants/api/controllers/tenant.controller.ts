import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TenantService } from '@modules/tenants/core/services/tenant.service';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async create(
    @Body()
    dto: {
      name: string;
      slug: string;
      domain: string;
      adminEmail: string;
      adminName: string;
    },
  ) {
    const tenant = await this.tenantService.createTenant(dto);
    return {
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        databaseName: tenant.databaseName,
        status: tenant.status,
        adminEmail: tenant.adminEmail,
        adminName: tenant.adminName,
      },
    };
  }

  @Get()
  async findAll() {
    const tenants = await this.tenantService.getAllTenants();
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      status: tenant.status,
      adminEmail: tenant.adminEmail,
      isActive: tenant.isActive(),
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantService.getTenantById(id);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      databaseName: tenant.databaseName,
      status: tenant.status,
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName,
      isActive: tenant.isActive(),
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const tenant = await this.tenantService.getTenantBySlug(slug);
    if (!tenant) {
      return { success: false, message: 'Tenant not found' };
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      status: tenant.status,
      isActive: tenant.isActive(),
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: { name?: string; slug?: string },
  ) {
    const tenant = await this.tenantService.updateTenant(id, dto);
    return {
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        status: tenant.status,
      },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tenantService.deleteTenant(id);
    return { success: true, message: 'Tenant deleted successfully' };
  }
}
