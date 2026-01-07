import { Module, Global } from '@nestjs/common';
import { S3StorageAdapter } from './adapters/s3-storage.adapter';
import { STORAGE_GATEWAY } from './ports/storage.port';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_GATEWAY,
      useClass: S3StorageAdapter,
    },
  ],
  exports: [STORAGE_GATEWAY],
})
export class StorageCoreModule {}
