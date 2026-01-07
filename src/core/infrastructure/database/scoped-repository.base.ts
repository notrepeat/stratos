import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, SQL } from 'drizzle-orm';

export abstract class ScopedRepository<T> {
  constructor(
    protected readonly db: NodePgDatabase,
    protected readonly table: any,
  ) {}

  protected scopeToTenant(tenantId: string, additionalFilters?: SQL[]): SQL {
    const filters: SQL[] = [eq(this.table.tenantId, tenantId)];

    if (additionalFilters) {
      filters.push(...additionalFilters);
    }

    return and(...filters) as SQL;
  }

  async findByTenant(tenantId: string): Promise<T[]> {
    return this.db
      .select()
      .from(this.table)
      .where(this.scopeToTenant(tenantId));
  }

  async findByIdScoped(id: string, tenantId: string): Promise<T | null> {
    const [row] = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.id, id), eq(this.table.tenantId, tenantId)));

    return row || null;
  }

  // Método helper para obtener tenantId del contexto
  protected getTenantIdFromContext(context: any): string {
    // Intentar obtener tenantId del contexto HTTP/GraphQL
    const tenantId = context?.req?.tenantId || context?.tenantId;

    if (!tenantId) {
      throw new Error(
        'Tenant context not found. Ensure AuthGuard is applied and user has tenantId.',
      );
    }

    return tenantId;
  }
}
