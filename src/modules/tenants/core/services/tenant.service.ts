import { Injectable, Inject } from '@nestjs/common';
import type { ITenantRepository } from '@modules/tenants/core/ports/tenant.repository.port';
import { TENANT_REPOSITORY } from '@modules/tenants/core/ports/tenant.repository.port';
import { Tenant } from '@modules/tenants/core/domain/tenant.entity';
import {
  ConflictException,
  NotFoundException,
} from '@core/exceptions/app.exceptions';

@Injectable()
export class TenantService {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly repository: ITenantRepository,
  ) {}

  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.repository.findByDomain(domain);
  }

  async createTenant(data: {
    name: string;
    slug: string;
    domain: string;
    adminEmail: string;
    adminName: string;
  }): Promise<Tenant> {
    // Validate slug uniqueness
    const existingSlug = await this.repository.findBySlug(data.slug);
    if (existingSlug) {
      throw new ConflictException('Ya existe un tenant con este slug', {
        field: 'slug',
        value: data.slug,
      });
    }

    // Validate domain uniqueness
    const existingDomain = await this.repository.findByDomain(data.domain);
    if (existingDomain) {
      throw new ConflictException('Ya existe un tenant con este dominio', {
        field: 'domain',
        value: data.domain,
      });
    }

    return this.repository.create({
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      adminEmail: data.adminEmail,
      adminName: data.adminName,
    });
  }

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await this.repository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Tenant', id);
    }
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.repository.findBySlug(slug);
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.repository.findAll();
  }

  async updateTenant(
    id: string,
    data: { name?: string; slug?: string },
  ): Promise<Tenant> {
    const tenant = await this.getTenantById(id);

    // If updating slug, validate uniqueness
    if (data.slug && data.slug !== tenant.slug) {
      const existing = await this.repository.findBySlug(data.slug);
      if (existing) {
        throw new Error('Tenant slug already exists');
      }
    }

    tenant.updateProfile(data.name || tenant.name, data.slug || tenant.slug);
    return this.repository.update(id, tenant);
  }

  async deleteTenant(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
