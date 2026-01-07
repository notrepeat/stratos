import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import {
  ITenantRepository,
  CreateTenantData,
} from '@modules/tenants/core/ports/tenant.repository.port';
import { tenants } from '@core/infrastructure/database/tenant.schema';
import { Tenant } from '@modules/tenants/core/domain/tenant.entity';
import { TenantConnectionManager } from '@core/services/tenant-connection-manager.service';

@Injectable()
export class TenantRepositoryAdapter implements ITenantRepository {
  constructor(private readonly connectionManager: TenantConnectionManager) {}

  async create(data: CreateTenantData): Promise<Tenant> {
    const tenantId = ulid();
    const dbName = `saas_tenant_${tenantId.substring(0, 16)}`;
    const now = new Date();

    // Create the physical database first
    await this.connectionManager.createTenantDatabase(dbName);

    // Use main connection for tenant metadata
    const db = this.connectionManager.getMainConnection();

    const [result] = await db
      .insert(tenants)
      .values({
        id: tenantId,
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        databaseName: dbName,
        adminEmail: data.adminEmail,
        adminName: data.adminName,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return Tenant.fromDatabase(result);
  }

  async findById(id: string): Promise<Tenant | null> {
    const db = this.connectionManager.getMainConnection();
    const [result] = await db.select().from(tenants).where(eq(tenants.id, id));

    return result ? Tenant.fromDatabase(result) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const db = this.connectionManager.getMainConnection();
    const [result] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug));

    return result ? Tenant.fromDatabase(result) : null;
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const db = this.connectionManager.getMainConnection();
    const [result] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.domain, domain));

    return result ? Tenant.fromDatabase(result) : null;
  }

  async findAll(): Promise<Tenant[]> {
    const db = this.connectionManager.getMainConnection();
    const results = await db.select().from(tenants);
    return results.map((result) => Tenant.fromDatabase(result));
  }

  async update(id: string, tenant: Tenant): Promise<Tenant> {
    const db = this.connectionManager.getMainConnection();
    const [result] = await db
      .update(tenants)
      .set({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        status: tenant.status,
        adminEmail: tenant.adminEmail,
        adminName: tenant.adminName,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return Tenant.fromDatabase(result);
  }

  async delete(id: string): Promise<void> {
    const db = this.connectionManager.getMainConnection();
    await db.delete(tenants).where(eq(tenants.id, id));
  }
}
