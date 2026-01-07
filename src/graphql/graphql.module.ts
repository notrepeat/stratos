import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { HealthResolver } from '../core/graphql/health.resolver';
import { UsersModule } from '../modules/users/users.module';
import { TenantsModule } from '../modules/tenants/tenants.module';
import { BillingModule } from '../modules/billing/billing.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ req, res }: { req: any; res: any }) => ({
        req,
        res,
        // Make request accessible for guards
        request: req,
        // Include headers for easier access
        headers: req?.headers,
      }),
    }),
    UsersModule,
    TenantsModule,
    BillingModule,
  ],
  providers: [HealthResolver],
  exports: [GraphQLModule],
})
export class GraphqlModule {}
