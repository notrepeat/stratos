import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphqlModule } from './graphql/graphql.module';
import { StorageCoreModule } from './core/infrastructure/storage/storage.module';
import { TenantThrottlerModule } from './core/services/tenant-throttler.module';
import { HealthController } from './core/controllers/health.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { BillingModule } from './modules/billing/billing.module';
import { PermissionsModule } from './core/permissions/permissions.module';
import { DatabaseModule } from './core/infrastructure/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second globally
      },
    ]),
    GraphqlModule,
    DatabaseModule,
    StorageCoreModule,
    TenantThrottlerModule,
    UsersModule,
    AuthModule,
    TenantsModule,
    BillingModule,
    PermissionsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
