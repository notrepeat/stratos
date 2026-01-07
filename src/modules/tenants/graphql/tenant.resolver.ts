import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TenantService } from '../core/services/tenant.service';
import { Tenant } from './tenant.type';
import { CreateTenantInput, UpdateTenantInput } from './tenant.input';

@Resolver(() => Tenant)
// @UseGuards(AuthGuard) // Temporarily disabled
export class TenantResolver {
  constructor(private readonly tenantService: TenantService) {}

  @Query(() => [Tenant], { name: 'tenants' })
  async getTenants(): Promise<Tenant[]> {
    const tenants = await this.tenantService.getAllTenants();
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      status: tenant.status,
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName,
      isActive: tenant.isActive(),
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }));
  }

  @Query(() => Tenant, { name: 'tenant', nullable: true })
  async getTenant(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Tenant | null> {
    const tenant = await this.tenantService.getTenantById(id);
    if (!tenant) return null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      status: tenant.status,
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName,
      isActive: tenant.isActive(),
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  @Query(() => Tenant, { name: 'tenantBySlug', nullable: true })
  async getTenantBySlug(@Args('slug') slug: string): Promise<Tenant | null> {
    const tenant = await this.tenantService.getTenantBySlug(slug);
    if (!tenant) return null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      status: tenant.status,
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName,
      isActive: tenant.isActive(),
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  @Mutation(() => Tenant, { name: 'createTenant' })
  async createTenant(@Args('input') input: CreateTenantInput): Promise<Tenant> {
    const tenant = await this.tenantService.createTenant(input);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      status: tenant.status,
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName,
      isActive: tenant.isActive(),
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  @Mutation(() => Tenant, { name: 'updateTenant' })
  async updateTenant(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateTenantInput,
  ): Promise<Tenant> {
    const tenant = await this.tenantService.updateTenant(id, input);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      status: tenant.status,
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName,
      isActive: tenant.isActive(),
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  @Mutation(() => Boolean, { name: 'deleteTenant' })
  async deleteTenant(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.tenantService.deleteTenant(id);
    return true;
  }
}
