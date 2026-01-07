import { Module, Global } from '@nestjs/common';
import { TenantThrottlerService } from './tenant-throttler.service';
import { TenantThrottleGuard } from '../guards/tenant-throttle.guard';

@Global()
@Module({
  providers: [TenantThrottlerService, TenantThrottleGuard],
  exports: [TenantThrottlerService, TenantThrottleGuard],
})
export class TenantThrottlerModule {}
