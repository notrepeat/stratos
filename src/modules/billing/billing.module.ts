import { Module } from '@nestjs/common';
import { BillingService } from '@modules/billing/core/services/billing.service';
import { InvoiceRepositoryAdapter } from '@modules/billing/infrastructure/adapters/invoice.repository.adapter';
import { PaymentRepositoryAdapter } from '@modules/billing/infrastructure/adapters/payment.repository.adapter';
import { SubscriptionRepositoryAdapter } from '@modules/billing/infrastructure/adapters/subscription.repository.adapter';
import { INVOICE_REPOSITORY } from '@modules/billing/core/ports/invoice.repository.port';
import { PAYMENT_REPOSITORY } from '@modules/billing/core/ports/payment.repository.port';
import { SUBSCRIPTION_REPOSITORY } from '@modules/billing/core/ports/subscription.repository.port';
import { BillingController } from '@modules/billing/api/controllers/billing.controller';
import { BillingResolver } from './graphql/billing.resolver';
import { DatabaseModule } from '@core/infrastructure/database/database.module';
import { CacheService } from '@core/services/cache.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    BillingResolver,
    CacheService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: InvoiceRepositoryAdapter,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepositoryAdapter,
    },
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionRepositoryAdapter,
    },
  ],
  exports: [
    BillingService,
    INVOICE_REPOSITORY,
    PAYMENT_REPOSITORY,
    SUBSCRIPTION_REPOSITORY,
    BillingResolver,
  ],
})
export class BillingModule {}
