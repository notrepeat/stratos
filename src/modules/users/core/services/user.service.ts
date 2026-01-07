import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../ports/user.repository.port';
import { User } from '../domain/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: IUserRepository,
  ) {}

  async createUser(data: {
    email: string;
    name: string;
    tenantId: string;
  }): Promise<User> {
    // TODO: Implement hashing and validation
    return this.repository.create(data);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.repository.getAll();
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateUser(id: string, data: { name?: string }): Promise<User> {
    const user = await this.getUserById(id);
    if (data.name) {
      user.updateProfile(data.name);
    }
    return this.repository.update(id, user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
