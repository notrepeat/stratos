import { User } from '../domain/user.entity';

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  getAll(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: User): Promise<User>;
  delete(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserData {
  email: string;
  name: string;
  tenantId: string;
  password?: string;
  isSuperAdmin?: boolean;
}
