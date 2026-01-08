import { Injectable, Inject } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { IUserRepository } from '@modules/users/core/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../users/core/ports/user.repository.port';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly sessionService: SessionService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch {
      return false;
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: any } | null> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(user.password, password);
    if (!isValidPassword) {
      return null;
    }

    // Create session
    const token = await this.sessionService.createSession({
      userId: user.id,
      tenantId: user.tenantId,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }

  async createUserWithPassword(data: {
    email: string;
    name: string;
    password: string;
    tenantId: string;
    isSuperAdmin?: boolean;
  }): Promise<any> {
    const hashedPassword = await this.hashPassword(data.password);

    return this.userRepository.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      tenantId: data.tenantId,
      isSuperAdmin: data.isSuperAdmin,
    });
  }
}
