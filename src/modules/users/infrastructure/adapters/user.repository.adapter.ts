import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import {
  IUserRepository,
  CreateUserData,
} from '../../core/ports/user.repository.port';
import { users } from '../../../../core/infrastructure/database/user.schema';
import { User } from '../../core/domain/user.entity';
import { TenantDatabaseService } from '../../../../core/services/tenant-database.service';

@Injectable()
export class UserRepositoryAdapter implements IUserRepository {
  constructor(private readonly tenantDatabaseService: TenantDatabaseService) {}

  async create(data: CreateUserData): Promise<User> {
    const userId = ulid();
    const now = new Date();

    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .insert(users)
      .values({
        id: userId,
        email: data.email,
        name: data.name,
        password: data.password,
        tenantId: data.tenantId,
        isSuperAdmin: data.isSuperAdmin || false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return User.fromDatabase(result);
  }

  async findById(id: string): Promise<User | null> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db.select().from(users).where(eq(users.id, id));

    return result ? User.fromDatabase(result) : null;
  }

  async getAll(): Promise<User[]> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const results = await db.select().from(users);
    return results.map((result) => User.fromDatabase(result));
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return result ? User.fromDatabase(result) : null;
  }

  async update(id: string, user: User): Promise<User> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    const [result] = await db
      .update(users)
      .set({
        name: user.name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return User.fromDatabase(result);
  }

  async delete(id: string): Promise<void> {
    const db = await this.tenantDatabaseService.getTenantConnection();
    await db.delete(users).where(eq(users.id, id));
  }
}
