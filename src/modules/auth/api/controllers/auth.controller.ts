import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: { email: string; name: string; password: string },
  ) {
    const user = await this.authService.createUserWithPassword({
      email: dto.email,
      name: dto.name,
      password: dto.password,
      tenantId: 'default', // TODO: Get from context
      isSuperAdmin: false,
    });

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  @Post('login')
  async login(@Body() dto: { email: string; password: string }) {
    const result = await this.authService.login(dto.email, dto.password);

    if (!result) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    return {
      success: true,
      data: result,
    };
  }

  @Post('logout')
  async logout(@Headers('authorization') token?: string) {
    if (!token) {
      return { success: false, message: 'No token provided' };
    }

    await this.sessionService.revokeSession(token.replace('Bearer ', ''));

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  async me(@Headers('authorization') token?: string) {
    if (!token) {
      return { success: false, message: 'No token provided' };
    }

    const session = await this.sessionService.validateSession(
      token.replace('Bearer ', ''),
    );

    if (!session) {
      return { success: false, message: 'Invalid token' };
    }

    return {
      success: true,
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
      },
    };
  }
}
