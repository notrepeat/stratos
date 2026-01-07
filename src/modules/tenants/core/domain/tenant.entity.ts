export class Tenant {
  id!: string;
  name!: string;
  slug!: string;
  domain!: string; // Routing principal
  databaseName!: string; // DB física asignada
  status!: 'active' | 'inactive' | 'cancelled';
  adminEmail!: string;
  adminName!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: Partial<Tenant>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static fromDatabase(data: any): Tenant {
    return new Tenant({
      id: data.id,
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      databaseName: data.databaseName,
      status: data.status,
      adminEmail: data.adminEmail,
      adminName: data.adminName,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Business logic methods
  isActive(): boolean {
    return this.status === 'active';
  }

  canAccessSystem(): boolean {
    return this.isActive();
  }

  updateProfile(name: string, slug: string): void {
    this.name = name;
    this.slug = slug;
    this.updatedAt = new Date();
  }

  isValidSlug(): boolean {
    // Slug should be lowercase, alphanumeric, hyphens only
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(this.slug) && this.slug.length >= 3;
  }

  isValidDomain(): boolean {
    // Basic domain validation (can be enhanced)
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(this.domain) || this.domain === 'localhost';
  }
}
