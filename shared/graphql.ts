// GraphQL Types for Stratos SaaS Frontend
// Auto-generated from backend GraphQL schema

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;

export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

// Core Entities
export type User = {
  __typename?: 'User';
  id: Scalars['ID'];
  email: Scalars['String'];
  name: Scalars['String'];
  tenantId?: Maybe<Scalars['String']>;
  isSuperAdmin: Scalars['Boolean'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type Tenant = {
  __typename?: 'Tenant';
  id: Scalars['ID'];
  name: Scalars['String'];
  slug: Scalars['String'];
  domain: Scalars['String'];
  status: Scalars['String'];
  adminEmail?: Maybe<Scalars['String']>;
  adminName?: Maybe<Scalars['String']>;
  isActive: Scalars['Boolean'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type Invoice = {
  __typename?: 'Invoice';
  id: Scalars['ID'];
  tenantId: Scalars['String'];
  amount: Scalars['Float'];
  currency: Scalars['String'];
  status: Scalars['String'];
  billingPeriodStart: Scalars['String'];
  billingPeriodEnd: Scalars['String'];
  dueDate: Scalars['String'];
  isOverdue: Scalars['Boolean'];
  outstandingAmount: Scalars['Float'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type Payment = {
  __typename?: 'Payment';
  id: Scalars['ID'];
  invoiceId: Scalars['String'];
  amount: Scalars['Float'];
  currency: Scalars['String'];
  paymentMethod: Scalars['String'];
  paymentDate: Scalars['String'];
  status: Scalars['String'];
  transactionId?: Maybe<Scalars['String']>;
  displayAmount: Scalars['Float'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type BillingSummary = {
  __typename?: 'BillingSummary';
  totalInvoices: Scalars['Int'];
  paidInvoices: Scalars['Int'];
  pendingInvoices: Scalars['Int'];
  overdueInvoices: Scalars['Int'];
  totalPaid: Scalars['Float'];
  totalPending: Scalars['Float'];
};

// Input Types
export type CreateUserInput = {
  email: Scalars['String'];
  name: Scalars['String'];
  tenantId?: InputMaybe<Scalars['String']>;
};

export type UpdateUserInput = {
  name?: InputMaybe<Scalars['String']>;
};

export type CreateTenantInput = {
  name: Scalars['String'];
  slug: Scalars['String'];
  domain: Scalars['String'];
  adminEmail: Scalars['String'];
  adminName: Scalars['String'];
};

export type UpdateTenantInput = {
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
};

export type GenerateInvoiceInput = {
  tenantId: Scalars['String'];
  billingPeriodStart: Scalars['String'];
  billingPeriodEnd: Scalars['String'];
};

export type ProcessPaymentInput = {
  invoiceId: Scalars['String'];
  amount: Scalars['Float'];
  paymentMethod: Scalars['String'];
  transactionId?: InputMaybe<Scalars['String']>;
  notes?: InputMaybe<Scalars['String']>;
};

export type CancelInvoiceInput = {
  id: Scalars['String'];
};

export type RefundPaymentInput = {
  id: Scalars['String'];
};

// GraphQL Operations
export type Query = {
  __typename?: 'Query';
  users: Array<User>;
  user?: Maybe<User>;
  userByEmail?: Maybe<User>;
  tenants: Array<Tenant>;
  tenant?: Maybe<Tenant>;
  tenantBySlug?: Maybe<Tenant>;
  invoices: Array<Invoice>;
  invoice?: Maybe<Invoice>;
  pendingInvoices: Array<Invoice>;
  payments: Array<Payment>;
  invoicePayments: Array<Payment>;
  overdueInvoices: Array<Invoice>;
  health: Scalars['String'];
  tenantsHealth: Scalars['String'];
  storageHealth: Scalars['String'];
  deepHealth: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createUser: User;
  updateUser: User;
  deleteUser: Scalars['Boolean'];
  createTenant: Tenant;
  updateTenant: Tenant;
  deleteTenant: Scalars['Boolean'];
  generateInvoice: Invoice;
  cancelInvoice: Invoice;
  processPayment: Payment;
  refundPayment: Payment;
};
