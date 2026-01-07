import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateTenantInput {
  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field()
  domain!: string;

  @Field()
  adminEmail!: string;

  @Field()
  adminName!: string;
}

@InputType()
export class UpdateTenantInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;
}
