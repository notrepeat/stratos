import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'SaaS Template Running',
      superadmin: 'Check logs for creation',
    };
  }
}
