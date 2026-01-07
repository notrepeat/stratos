import { Module } from '@nestjs/common';
import { AuthService } from './core/services/auth.service';
import { SessionService } from './core/services/session.service';
import { AuthController } from './api/controllers/auth.controller';
import { AuthGuard } from '../../core/guards/auth.guard';
import { DatabaseModule } from '../../core/infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    AuthGuard,
    {
      provide: 'SESSION_SERVICE',
      useExisting: SessionService,
    },
  ],
  exports: [AuthService, SessionService, AuthGuard, 'SESSION_SERVICE'],
})
export class AuthModule {}
