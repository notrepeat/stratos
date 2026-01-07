import { Module } from '@nestjs/common';
import { StorageController } from './api/controllers/storage.controller';

@Module({
  controllers: [StorageController],
  providers: [],
  exports: [],
})
export class StorageModule {}
