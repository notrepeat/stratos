import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class GenerateInvoiceInput {
  @Field()
  tenantId!: string;

  @Field()
  billingPeriodStart!: string;

  @Field()
  billingPeriodEnd!: string;
}

@InputType()
export class ProcessPaymentInput {
  @Field()
  invoiceId!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  paymentMethod!: 'stripe' | 'paypal' | 'bank_transfer' | 'other';

  @Field({ nullable: true })
  transactionId?: string;

  @Field({ nullable: true })
  notes?: string;
}

@InputType()
export class CancelInvoiceInput {
  @Field()
  id!: string;
}

@InputType()
export class RefundPaymentInput {
  @Field()
  id!: string;
}
