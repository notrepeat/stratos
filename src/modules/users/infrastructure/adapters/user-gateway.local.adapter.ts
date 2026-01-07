import { Injectable } from '@nestjs/common';
import { IUserGateway } from '../../core/ports/user.gateway.port';
import { UserService } from '../../core/services/user.service';

@Injectable()
export class UserGatewayLocalAdapter implements IUserGateway {
  constructor(
    private readonly userService: UserService, // ✅ Única excepción: dentro del mismo slice
  ) {}

  async getUserEmail(userId: string): Promise<string> {
    const user = await this.userService.getUserById(userId);
    return user.email;
  }
}
