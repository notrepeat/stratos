import { Module } from '@nestjs/common';
import { BillingService } from '@modules/billing/core/services/billing.service';
import { InvoiceRepositoryAdapter } from '@modules/billing/infrastructure/adapters/invoice.repository.adapter';
import { PaymentRepositoryAdapter } from '@modules/billing/infrastructure/adapters/payment.repository.adapter';
import { INVOICE_REPOSITORY } from '@modules/billing/core/ports/invoice.repository.port';
import { PAYMENT_REPOSITORY } from '@modules/billing/core/ports/payment.repository.port';
import { BillingController } from '@modules/billing/api/controllers/billing.controller';
import { DatabaseModule } from '@core/infrastructure/database/database.module';
import { CacheService } from '@core/services/cache.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    CacheService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: InvoiceRepositoryAdapter,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepositoryAdapter,
    },
  ],
  exports: [BillingService, INVOICE_REPOSITORY, PAYMENT_REPOSITORY],
})
export class BillingModule {}
