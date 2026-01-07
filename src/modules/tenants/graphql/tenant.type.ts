import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Tenant {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field()
  domain!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  adminEmail?: string;

  @Field({ nullable: true })
  adminName?: string;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
