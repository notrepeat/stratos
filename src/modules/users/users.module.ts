import { Module } from '@nestjs/common';
import { UserService } from './core/services/user.service';
import { SuperAdminService } from './core/services/super-admin.service';
import { UserRepositoryAdapter } from './infrastructure/adapters/user.repository.adapter';
import { UserGatewayLocalAdapter } from './infrastructure/adapters/user-gateway.local.adapter';
import { USER_REPOSITORY } from './core/ports/user.repository.port';
import { USER_GATEWAY } from './core/ports/user.gateway.port';
import { UsersController } from './api/controllers/users.controller';
import { DatabaseModule } from '../../core/infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    UserService,
    SuperAdminService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: USER_GATEWAY,
      useClass: UserGatewayLocalAdapter, // Hoy local, mañana gRPC
    },
  ],
  exports: [
    UserService,
    SuperAdminService,
    USER_REPOSITORY, // ✅ Exportamos el REPOSITORY para que otros módulos lo usen
    USER_GATEWAY, // ✅ Exportamos el GATEWAY, NO el Service
  ],
})
export class UsersModule {}
