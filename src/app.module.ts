import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from './modules/storage/storage.module';
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
    DatabaseModule,
    StorageModule,
    UsersModule,
    AuthModule,
    TenantsModule,
    BillingModule,
    PermissionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
