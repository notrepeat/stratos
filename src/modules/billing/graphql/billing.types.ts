import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Invoice {
  @Field(() => ID)
  id!: string;

  @Field()
  tenantId!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;

  @Field()
  status!: string;

  @Field()
  billingPeriodStart!: Date;

  @Field()
  billingPeriodEnd!: Date;

  @Field()
  dueDate!: Date;

  @Field()
  isOverdue!: boolean;

  @Field(() => Float)
  outstandingAmount!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class Payment {
  @Field(() => ID)
  id!: string;

  @Field()
  invoiceId!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;

  @Field()
  paymentMethod!: string;

  @Field()
  paymentDate!: Date;

  @Field()
  status!: string;

  @Field({ nullable: true })
  transactionId?: string;

  @Field(() => Float)
  displayAmount!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class BillingSummary {
  @Field()
  totalInvoices!: number;

  @Field()
  paidInvoices!: number;

  @Field()
  pendingInvoices!: number;

  @Field()
  overdueInvoices!: number;

  @Field(() => Float)
  totalPaid!: number;

  @Field(() => Float)
  totalPending!: number;
}
