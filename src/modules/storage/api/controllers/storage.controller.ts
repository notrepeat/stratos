import { Controller, Get } from '@nestjs/common';

@Controller('storage')
export class StorageController {
  @Get('health')
  getHealth() {
    return {
      status: 'Storage module operational',
      message: 'S3 streaming adapter ready',
      bucket: 'stratos',
      endpoint: 'http://localhost:9002',
    };
  }
}
