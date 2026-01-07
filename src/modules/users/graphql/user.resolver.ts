import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from '../core/services/user.service';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { User } from './user.type';
import { CreateUserInput, UpdateUserInput } from './user.input';

@Resolver(() => User)
@UseGuards(AuthGuard)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User], { name: 'users' })
  async getUsers(@Context() context: any): Promise<User[]> {
    // Get tenant from context (set by middleware)
    const tenantId =
      context.req?.tenantContext?.tenantId || context.req?.user?.tenantId;

    if (!tenantId) {
      throw new Error('Tenant context not found');
    }

    return this.userService.getAllUsers();
  }

  @Query(() => User, { name: 'user', nullable: true })
  async getUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<User | null> {
    return this.userService.getUserById(id);
  }

  @Query(() => User, { name: 'userByEmail', nullable: true })
  async getUserByEmail(@Args('email') email: string): Promise<User | null> {
    return this.userService.getUserByEmail(email);
  }

  @Mutation(() => User, { name: 'createUser' })
  async createUser(
    @Args('input') input: CreateUserInput,
    @Context() context: any,
  ): Promise<User> {
    // Get tenant from context
    const tenantId =
      context.req?.tenantContext?.tenantId ||
      context.req?.user?.tenantId ||
      input.tenantId;

    if (!tenantId) {
      throw new Error('Tenant context not found');
    }

    return this.userService.createUser({
      ...input,
      tenantId,
    });
  }

  @Mutation(() => User, { name: 'updateUser' })
  async updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<User> {
    return this.userService.updateUser(id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteUser' })
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.userService.deleteUser(id);
    return true;
  }
}
