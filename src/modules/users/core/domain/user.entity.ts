export class User {
  id!: string;
  email!: string;
  name!: string;
  password!: string;
  tenantId!: string;
  isSuperAdmin!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data?: Partial<User>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  static fromDatabase(data: any): User {
    return new User({
      id: data.id,
      email: data.email,
      name: data.name,
      password: data.password,
      tenantId: data.tenantId,
      isSuperAdmin: data.isSuperAdmin,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Business logic methods
  canAccessTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }

  updateProfile(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  hasSuperAdminAccess(): boolean {
    return this.isSuperAdmin;
  }

  hasPassword(): boolean {
    return !!this.password;
  }
}
