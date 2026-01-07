import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../../core/services/user.service';
import { AuthGuard } from '@core/guards/auth.guard';
import { PermissionGuard } from '@core/guards/permission.guard';
import {
  RequireUserSelf,
  RequireTenantAdmin,
} from '@core/decorators/permissions.decorator';

@Controller('users')
@UseGuards(AuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() dto: { email: string; name: string; tenantId: string }) {
    return this.userService.createUser(dto);
  }

  @Get()
  async findAll() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.userService.getUserByEmail(email);
  }

  @Put(':id')
  @RequireUserSelf() // User can update themselves, or tenant admin can update anyone
  async update(@Param('id') id: string, @Body() dto: { name?: string }) {
    return this.userService.updateUser(id, dto);
  }

  @Delete(':id')
  @RequireTenantAdmin() // Only tenant admins can delete users
  async remove(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return { message: 'User deleted' };
  }
}
