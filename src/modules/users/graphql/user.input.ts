import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  tenantId?: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string;
}
