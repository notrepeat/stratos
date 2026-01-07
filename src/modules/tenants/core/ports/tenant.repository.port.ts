import { Tenant } from '../domain/tenant.entity';

export interface ITenantRepository {
  create(data: CreateTenantData): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findByDomain(domain: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
  update(id: string, tenant: Tenant): Promise<Tenant>;
  delete(id: string): Promise<void>;
}

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

export interface CreateTenantData {
  name: string;
  slug: string;
  domain: string;
  adminEmail: string;
  adminName: string;
}
