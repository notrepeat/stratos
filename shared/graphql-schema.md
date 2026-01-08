# GraphQL Schema for Stratos SaaS Frontend

This document provides a detailed overview of the GraphQL schema used in the Stratos SaaS application. It includes all types, queries, mutations, and inputs that the frontend will interact with.

## Scalars

- `ID`: String (unique identifier)
- `String`: String
- `Boolean`: Boolean
- `Int`: Number (integer)
- `Float`: Number (floating point)

## Object Types

### User

Represents a user in the system.

Fields:

- `id: ID!` - Unique identifier
- `email: String!` - User's email address
- `name: String!` - User's full name
- `tenantId?: String` - Associated tenant ID (optional)
- `isSuperAdmin: Boolean!` - Whether the user is a super admin
- `createdAt: String!` - Creation timestamp (ISO string)
- `updatedAt: String!` - Last update timestamp (ISO string)

### Tenant

Represents a tenant (organization) in the multi-tenant system.

Fields:

- `id: ID!` - Unique identifier
- `name: String!` - Tenant name
- `slug: String!` - URL-friendly identifier
- `domain: String!` - Domain name
- `status: String!` - Current status
- `adminEmail?: String` - Administrator email (optional)
- `adminName?: String` - Administrator name (optional)
- `isActive: Boolean!` - Whether the tenant is active
- `createdAt: String!` - Creation timestamp (ISO string)
- `updatedAt: String!` - Last update timestamp (ISO string)

### Invoice

Represents a billing invoice.

Fields:

- `id: ID!` - Unique identifier
- `tenantId: String!` - Associated tenant ID
- `amount: Float!` - Invoice amount
- `currency: String!` - Currency code
- `status: String!` - Invoice status
- `billingPeriodStart: String!` - Billing period start date (ISO string)
- `billingPeriodEnd: String!` - Billing period end date (ISO string)
- `dueDate: String!` - Due date (ISO string)
- `isOverdue: Boolean!` - Whether the invoice is overdue
- `outstandingAmount: Float!` - Remaining amount to pay
- `createdAt: String!` - Creation timestamp (ISO string)
- `updatedAt: String!` - Last update timestamp (ISO string)

### Payment

Represents a payment made against an invoice.

Fields:

- `id: ID!` - Unique identifier
- `invoiceId: String!` - Associated invoice ID
- `amount: Float!` - Payment amount
- `currency: String!` - Currency code
- `paymentMethod: String!` - Payment method used
- `paymentDate: String!` - Payment date (ISO string)
- `status: String!` - Payment status
- `transactionId?: String` - External transaction ID (optional)
- `displayAmount: Float!` - Formatted display amount
- `createdAt: String!` - Creation timestamp (ISO string)
- `updatedAt: String!` - Last update timestamp (ISO string)

### BillingSummary

Summary of billing statistics.

Fields:

- `totalInvoices: Int!` - Total number of invoices
- `paidInvoices: Int!` - Number of paid invoices
- `pendingInvoices: Int!` - Number of pending invoices
- `overdueInvoices: Int!` - Number of overdue invoices
- `totalPaid: Float!` - Total amount paid
- `totalPending: Float!` - Total amount pending

## Input Types

### CreateUserInput

Input for creating a new user.

Fields:

- `email: String!` - User's email address
- `name: String!` - User's full name
- `tenantId?: String` - Associated tenant ID (optional)

### UpdateUserInput

Input for updating an existing user.

Fields:

- `name?: String` - Updated name (optional)

### CreateTenantInput

Input for creating a new tenant.

Fields:

- `name: String!` - Tenant name
- `slug: String!` - URL-friendly identifier
- `domain: String!` - Domain name
- `adminEmail: String!` - Administrator email
- `adminName: String!` - Administrator name

### UpdateTenantInput

Input for updating an existing tenant.

Fields:

- `name?: String` - Updated name (optional)
- `slug?: String` - Updated slug (optional)

### GenerateInvoiceInput

Input for generating a new invoice.

Fields:

- `tenantId: String!` - Tenant ID for the invoice
- `billingPeriodStart: String!` - Billing period start date (ISO string)
- `billingPeriodEnd: String!` - Billing period end date (ISO string)

### ProcessPaymentInput

Input for processing a payment.

Fields:

- `invoiceId: String!` - Invoice ID to pay
- `amount: Float!` - Payment amount
- `paymentMethod: String!` - Payment method
- `transactionId?: String` - External transaction ID (optional)
- `notes?: String` - Payment notes (optional)

### CancelInvoiceInput

Input for canceling an invoice.

Fields:

- `id: String!` - Invoice ID to cancel

### RefundPaymentInput

Input for refunding a payment.

Fields:

- `id: String!` - Payment ID to refund

## Query Operations

### users

Get all users.

**Arguments:** None (context-based filtering may apply)

**Returns:** `[User!]!` - Array of users

### user

Get a specific user by ID.

**Arguments:**

- `id: ID!` - User ID

**Returns:** `User` - Single user or null

### userByEmail

Get a user by email address.

**Arguments:**

- `email: String!` - Email address

**Returns:** `User` - Single user or null

### tenants

Get all tenants.

**Arguments:** None

**Returns:** `[Tenant!]!` - Array of tenants

### tenant

Get a specific tenant by ID.

**Arguments:**

- `id: ID!` - Tenant ID

**Returns:** `Tenant` - Single tenant or null

### tenantBySlug

Get a tenant by slug.

**Arguments:**

- `slug: String!` - Tenant slug

**Returns:** `Tenant` - Single tenant or null

### invoices

Get invoices for a tenant.

**Arguments:**

- `tenantId: String!` - Tenant ID

**Returns:** `[Invoice!]!` - Array of invoices

### invoice

Get a specific invoice by ID.

**Arguments:**

- `id: ID!` - Invoice ID

**Returns:** `Invoice!` - Single invoice

### pendingInvoices

Get pending invoices for a tenant.

**Arguments:**

- `tenantId: String!` - Tenant ID

**Returns:** `[Invoice!]!` - Array of pending invoices

### overdueInvoices

Get all overdue invoices.

**Arguments:** None

**Returns:** `[Invoice!]!` - Array of overdue invoices

### payments

Get payments for a tenant.

**Arguments:**

- `tenantId: String!` - Tenant ID

**Returns:** `[Payment!]!` - Array of payments

### invoicePayments

Get payments for a specific invoice.

**Arguments:**

- `invoiceId: String!` - Invoice ID

**Returns:** `[Payment!]!` - Array of payments for the invoice

### health

Get basic health check status.

**Arguments:** None

**Returns:** `String!` - Health status message

### tenantsHealth

Get tenant connections health status.

**Arguments:** None

**Returns:** `String!` - Tenants health status (JSON string)

### storageHealth

Get storage health status.

**Arguments:** None

**Returns:** `String!` - Storage health status (JSON string)

### deepHealth

Get comprehensive health check.

**Arguments:** None

**Returns:** `String!` - Deep health status (JSON string)

## Mutation Operations

### createUser

Create a new user.

**Arguments:**

- `input: CreateUserInput!` - User creation data

**Returns:** `User!` - Created user

### updateUser

Update an existing user.

**Arguments:**

- `id: ID!` - User ID
- `input: UpdateUserInput!` - Update data

**Returns:** `User!` - Updated user

### deleteUser

Delete a user.

**Arguments:**

- `id: ID!` - User ID

**Returns:** `Boolean!` - Success status

### createTenant

Create a new tenant.

**Arguments:**

- `input: CreateTenantInput!` - Tenant creation data

**Returns:** `Tenant!` - Created tenant

### updateTenant

Update an existing tenant.

**Arguments:**

- `id: ID!` - Tenant ID
- `input: UpdateTenantInput!` - Update data

**Returns:** `Tenant!` - Updated tenant

### deleteTenant

Delete a tenant.

**Arguments:**

- `id: ID!` - Tenant ID

**Returns:** `Boolean!` - Success status

### generateInvoice

Generate a new invoice.

**Arguments:**

- `input: GenerateInvoiceInput!` - Invoice generation data

**Returns:** `Invoice!` - Generated invoice

### cancelInvoice

Cancel an invoice.

**Arguments:**

- `input: CancelInvoiceInput!` - Invoice cancellation data

**Returns:** `Invoice!` - Canceled invoice

### processPayment

Process a payment.

**Arguments:**

- `input: ProcessPaymentInput!` - Payment processing data

**Returns:** `Payment!` - Processed payment

### refundPayment

Refund a payment.

**Arguments:**

- `input: RefundPaymentInput!` - Payment refund data

**Returns:** `Payment!` - Refunded payment

## Notes

- All date fields are represented as ISO 8601 strings in the GraphQL schema
- Optional fields are marked with `?` in the type definitions
- The schema supports multi-tenancy with context-based filtering
- Health check queries return JSON strings for structured data
- Billing operations include comprehensive invoice and payment management
