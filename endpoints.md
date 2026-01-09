# API Endpoints Documentation

This document describes all GraphQL and HTTP endpoints in the Nest.js application, including request and response structures.

## Core Module

### HTTP Controllers

#### GET /

**Path:** `/`  
**Method:** GET  
**Request:** None  
**Response:**

```json
{
  "message": "string",
  "superadmin": "string"
}
```

#### GET /health

**Path:** `/health`  
**Method:** GET  
**Request:** None  
**Response:**

```json
{
  "status": "string",
  "timestamp": "string",
  "service": "string"
}
```

#### GET /health/tenants

**Path:** `/health/tenants`  
**Method:** GET  
**Request:** None  
**Response:**

```json
{
  "timestamp": "string",
  "summary": {
    "totalTenants": "number",
    "healthy": "number",
    "unhealthy": "number"
  },
  "tenants": "array",
  "mainConnection": "any"
}
```

#### GET /health/storage

**Path:** `/health/storage`  
**Method:** GET  
**Request:** None  
**Response:**

```json
{
  "status": "string",
  "timestamp": "string",
  "storage": "string"
}
```

or

```json
{
  "status": "string",
  "timestamp": "string",
  "error": "string"
}
```

#### GET /health/deep

**Path:** `/health/deep`  
**Method:** GET  
**Request:** None  
**Response:**

```json
{
  "status": "string",
  "timestamp": "string",
  "checks": {
    "tenants": "any",
    "storage": "any"
  }
}
```

#### GET /permissions/user/:userId

**Path:** `/permissions/user/:userId`  
**Method:** GET  
**Request:**

- Path Parameter: `userId` (string)  
  **Guards:** AuthGuard, PermissionGuard (RequireSuperAdmin)  
  **Response:**

```json
{
  "success": "boolean",
  "data": "any"
}
```

#### GET /permissions/me

**Path:** `/permissions/me`  
**Method:** GET  
**Request:** None (user from AuthGuard)  
**Guards:** AuthGuard, PermissionGuard  
**Response:**

```json
{
  "success": "boolean",
  "data": "any"
}
```

#### POST /permissions/tenants/:tenantId/users

**Path:** `/permissions/tenants/:tenantId/users`  
**Method:** POST  
**Request:**

- Path Parameter: `tenantId` (string)
- Body:

```json
{
  "userId": "string",
  "role": "'admin' | 'member'" // optional
}
```

**Guards:** AuthGuard, PermissionGuard (RequireTenantAdmin)  
**Response:**

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### DELETE /permissions/tenants/:tenantId/users/:userId

**Path:** `/permissions/tenants/:tenantId/users/:userId`  
**Method:** DELETE  
**Request:**

- Path Parameters: `tenantId` (string), `userId` (string)  
  **Guards:** AuthGuard, PermissionGuard (RequireTenantAdmin)  
  **Response:**

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### POST /permissions/tenants/:tenantId/admins/:userId

**Path:** `/permissions/tenants/:tenantId/admins/:userId`  
**Method:** POST  
**Request:**

- Path Parameters: `tenantId` (string), `userId` (string)  
  **Guards:** AuthGuard, PermissionGuard (RequireTenantAdmin)  
  **Response:**

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### DELETE /permissions/tenants/:tenantId/admins/:userId

**Path:** `/permissions/tenants/:tenantId/admins/:userId`  
**Method:** DELETE  
**Request:**

- Path Parameters: `tenantId` (string), `userId` (string)  
  **Guards:** AuthGuard, PermissionGuard (RequireTenantAdmin)  
  **Response:**

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### POST /permissions/check

**Path:** `/permissions/check`  
**Method:** POST  
**Request:**

- Body:

```json
{
  "resource": "string",
  "permission": "string",
  "userId": "string" // optional
}
```

**Guards:** AuthGuard, PermissionGuard  
**Response:**

```json
{
  "success": "boolean",
  "data": {
    "resource": "string",
    "permission": "string",
    "userId": "string",
    "hasPermission": "boolean"
  }
}
```

#### POST /permissions/resources

**Path:** `/permissions/resources`  
**Method:** POST  
**Request:**

- Body:

```json
{
  "resources": "string[]",
  "permission": "string",
  "userId": "string" // optional
}
```

**Guards:** AuthGuard, PermissionGuard  
**Response:**

```json
{
  "success": "boolean",
  "data": {
    "requested": "string[]",
    "accessible": "string[]",
    "permission": "string",
    "userId": "string"
  }
}
```

### GraphQL Resolvers

#### Query: health

**Name:** `health`  
**Request:** None  
**Response:**

```json
{
  "status": "string",
  "timestamp": "string",
  "service": "string"
}
```

#### Query: tenantsHealth

**Name:** `tenantsHealth`  
**Request:** None  
**Response:**

```json
{
  "timestamp": "string",
  "summary": {
    "totalTenants": "number",
    "healthy": "number",
    "unhealthy": "number"
  },
  "tenants": [
    {
      "tenant": "string",
      "status": "string"
    }
  ],
  "mainConnection": "any"
}
```

#### Query: storageHealth

**Name:** `storageHealth`  
**Request:** None  
**Response:**

```json
{
  "status": "string",
  "timestamp": "string",
  "storage": "string"
}
```

#### Query: deepHealth

**Name:** `deepHealth`  
**Request:** None  
**Response:**

```json
{
  "status": "string",
  "timestamp": "string",
  "checks": {
    "tenants": "string",
    "storage": "string"
  }
}
```

## Auth Module

### HTTP Controllers

#### POST /auth/register

**Path:** `/auth/register`  
**Method:** POST  
**Request:**

- Body:

```json
{
  "email": "string",
  "name": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

#### POST /auth/login

**Path:** `/auth/login`  
**Method:** POST  
**Request:**

- Body:

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": "boolean",
  "data": "any"
}
```

or

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### POST /auth/logout

**Path:** `/auth/logout`  
**Method:** POST  
**Request:**

- Header: `authorization` (Bearer token)  
  **Response:**

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### GET /auth/me

**Path:** `/auth/me`  
**Method:** GET  
**Request:**

- Header: `authorization` (Bearer token)  
  **Response:**

```json
{
  "success": "boolean",
  "data": {
    "userId": "string",
    "tenantId": "string"
  }
}
```

or

```json
{
  "success": "boolean",
  "message": "string"
}
```

## Users Module

### HTTP Controllers

#### POST /users

**Path:** `/users`  
**Method:** POST  
**Request:**

- Body:

```json
{
  "email": "string",
  "name": "string",
  "tenantId": "string"
}
```

**Guards:** AuthGuard, PermissionGuard  
**Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### GET /users

**Path:** `/users`  
**Method:** GET  
**Request:** None  
**Guards:** AuthGuard, PermissionGuard  
**Response:** Array of

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### GET /users/:id

**Path:** `/users/:id`  
**Method:** GET  
**Request:**

- Path Parameter: `id` (string)  
  **Guards:** AuthGuard, PermissionGuard  
  **Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### GET /users/email/:email

**Path:** `/users/email/:email`  
**Method:** GET  
**Request:**

- Path Parameter: `email` (string)  
  **Guards:** AuthGuard, PermissionGuard  
  **Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### PUT /users/:id

**Path:** `/users/:id`  
**Method:** PUT  
**Request:**

- Path Parameter: `id` (string)
- Body:

```json
{
  "name": "string" // optional
}
```

**Guards:** AuthGuard, PermissionGuard (RequireUserSelf)  
**Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### GET /users

**Path:** `/users`  
**Method:** GET  
**Request:** None  
**Guards:** AuthGuard, PermissionGuard  
**Response:** Array of

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### GET /users/:id

**Path:** `/users/:id`  
**Method:** GET  
**Request:**

- Path Parameter: `id` (string)  
  **Guards:** AuthGuard, PermissionGuard  
  **Response:** `User` (object)

#### GET /users/email/:email

**Path:** `/users/email/:email`  
**Method:** GET  
**Request:**

- Path Parameter: `email` (string)  
  **Guards:** AuthGuard, PermissionGuard  
  **Response:** `User` (object)

#### PUT /users/:id

**Path:** `/users/:id`  
**Method:** PUT  
**Request:**

- Path Parameter: `id` (string)
- Body:

```json
{
  "name": "string" // optional
}
```

**Guards:** AuthGuard, PermissionGuard (RequireUserSelf)  
**Response:** `User` (object)

#### DELETE /users/:id

**Path:** `/users/:id`  
**Method:** DELETE  
**Request:**

- Path Parameter: `id` (string)  
  **Guards:** AuthGuard, PermissionGuard (RequireTenantAdmin)  
  **Response:**

```json
{
  "message": "string"
}
```

### GraphQL Resolvers

#### Query: users

**Name:** `users`  
**Request:** None (context: tenantId)  
**Response:** Array of

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Query: user

**Name:** `user`  
**Request:** `id: ID`  
**Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

or `null`

#### Query: userByEmail

**Name:** `userByEmail`  
**Request:** `email: string`  
**Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

or `null`

#### Mutation: createUser

**Name:** `createUser`  
**Request:** `input: CreateUserInput` (context: tenantId)  
**Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Mutation: updateUser

**Name:** `updateUser`  
**Request:** `id: ID, input: UpdateUserInput`  
**Response:**

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "tenantId": "string",
  "isSuperAdmin": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Mutation: deleteUser

**Name:** `deleteUser`  
**Request:** `id: ID`  
**Response:** `Boolean`

## Tenants Module

### HTTP Controllers

#### POST /tenants

**Path:** `/tenants`  
**Method:** POST  
**Request:**

- Body:

```json
{
  "name": "string",
  "slug": "string",
  "domain": "string",
  "adminEmail": "string",
  "adminName": "string"
}
```

**Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "domain": "string",
    "databaseName": "string",
    "status": "string",
    "adminEmail": "string",
    "adminName": "string"
  }
}
```

#### GET /tenants

**Path:** `/tenants`  
**Method:** GET  
**Request:** None  
**Response:** Array of

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "domain": "string",
  "status": "string",
  "adminEmail": "string",
  "isActive": "boolean"
}
```

#### GET /tenants/:id

**Path:** `/tenants/:id`  
**Method:** GET  
**Request:**

- Path Parameter: `id` (string)  
  **Response:**

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "domain": "string",
  "databaseName": "string",
  "status": "string",
  "adminEmail": "string",
  "adminName": "string",
  "isActive": "boolean"
}
```

#### GET /tenants/slug/:slug

**Path:** `/tenants/slug/:slug`  
**Method:** GET  
**Request:**

- Path Parameter: `slug` (string)  
  **Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "domain": "string",
    "status": "string",
    "isActive": "boolean"
  }
}
```

or

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### PUT /tenants/:id

**Path:** `/tenants/:id`  
**Method:** PUT  
**Request:**

- Path Parameter: `id` (string)
- Body:

```json
{
  "name": "string", // optional
  "slug": "string" // optional
}
```

**Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "domain": "string",
    "status": "string"
  }
}
```

#### DELETE /tenants/:id

**Path:** `/tenants/:id`  
**Method:** DELETE  
**Request:**

- Path Parameter: `id` (string)  
  **Response:**

```json
{
  "success": "boolean",
  "message": "string"
}
```

### GraphQL Resolvers

#### Query: tenants

**Name:** `tenants`  
**Request:** None  
**Response:** Array of

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "domain": "string",
  "status": "string",
  "adminEmail": "string",
  "adminName": "string",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Query: tenant

**Name:** `tenant`  
**Request:** `id: ID`  
**Response:**

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "domain": "string",
  "status": "string",
  "adminEmail": "string",
  "adminName": "string",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

or `null`

#### Query: tenantBySlug

**Name:** `tenantBySlug`  
**Request:** `slug: string`  
**Response:**

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "domain": "string",
  "status": "string",
  "adminEmail": "string",
  "adminName": "string",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

or `null`

#### Mutation: createTenant

**Name:** `createTenant`  
**Request:** `input: CreateTenantInput`  
**Response:**

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "domain": "string",
  "status": "string",
  "adminEmail": "string",
  "adminName": "string",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Mutation: updateTenant

**Name:** `updateTenant`  
**Request:** `id: ID, input: UpdateTenantInput`  
**Response:**

```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "domain": "string",
  "status": "string",
  "adminEmail": "string",
  "adminName": "string",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Mutation: deleteTenant

**Name:** `deleteTenant`  
**Request:** `id: ID`  
**Response:** `Boolean`

## Billing Module

### HTTP Controllers

#### POST /billing/invoices/generate/:tenantId

**Path:** `/billing/invoices/generate/:tenantId`  
**Method:** POST  
**Request:**

- Path Parameter: `tenantId` (string)
- Body:

```json
{
  "billingPeriodStart": "string",
  "billingPeriodEnd": "string"
}
```

**Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "tenantId": "string",
    "amount": "number",
    "currency": "string",
    "status": "string",
    "billingPeriodStart": "Date",
    "billingPeriodEnd": "Date",
    "dueDate": "Date"
  }
}
```

#### GET /billing/invoices/tenant/:tenantId

**Path:** `/billing/invoices/tenant/:tenantId`  
**Method:** GET  
**Request:**

- Path Parameter: `tenantId` (string)  
  **Response:** Array of

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "billingPeriodStart": "Date",
  "billingPeriodEnd": "Date",
  "dueDate": "Date",
  "isOverdue": "boolean",
  "outstandingAmount": "number"
}
```

#### GET /billing/invoices/tenant/:tenantId/pending

**Path:** `/billing/invoices/tenant/:tenantId/pending`  
**Method:** GET  
**Request:**

- Path Parameter: `tenantId` (string)  
  **Response:** Array of

```json
{
  "id": "string",
  "amount": "number",
  "currency": "string",
  "dueDate": "Date",
  "isOverdue": "boolean"
}
```

#### GET /billing/invoices/:id

**Path:** `/billing/invoices/:id`  
**Method:** GET  
**Request:**

- Path Parameter: `id` (string)  
  **Response:**

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "billingPeriodStart": "Date",
  "billingPeriodEnd": "Date",
  "dueDate": "Date",
  "isOverdue": "boolean"
}
```

or

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### POST /billing/payments

**Path:** `/billing/payments`  
**Method:** POST  
**Request:**

- Body:

```json
{
  "invoiceId": "string",
  "amount": "number",
  "paymentMethod": "'stripe' | 'paypal' | 'bank_transfer' | 'other'",
  "transactionId": "string", // optional
  "notes": "string" // optional
}
```

**Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "invoiceId": "string",
    "amount": "number",
    "currency": "string",
    "paymentMethod": "string",
    "paymentDate": "Date",
    "status": "string",
    "transactionId": "string"
  }
}
```

#### GET /billing/payments/tenant/:tenantId

**Path:** `/billing/payments/tenant/:tenantId`  
**Method:** GET  
**Request:**

- Path Parameter: `tenantId` (string)  
  **Response:** Array of

```json
{
  "id": "string",
  "invoiceId": "string",
  "amount": "number",
  "currency": "string",
  "paymentMethod": "string",
  "paymentDate": "Date",
  "status": "string",
  "transactionId": "string",
  "displayAmount": "string"
}
```

#### GET /billing/payments/invoice/:invoiceId

**Path:** `/billing/payments/invoice/:invoiceId`  
**Method:** GET  
**Request:**

- Path Parameter: `invoiceId` (string)  
  **Response:** Array of

```json
{
  "id": "string",
  "amount": "number",
  "paymentMethod": "string",
  "paymentDate": "Date",
  "status": "string",
  "transactionId": "string"
}
```

#### POST /billing/invoices/:id/cancel

**Path:** `/billing/invoices/:id/cancel`  
**Method:** POST  
**Request:**

- Path Parameter: `id` (string)  
  **Response:**

```json
{
  "success": "boolean",
  "message": "string",
  "data": {
    "id": "string",
    "status": "string"
  }
}
```

#### POST /billing/payments/:id/refund

**Path:** `/billing/payments/:id/refund`  
**Method:** POST  
**Request:**

- Path Parameter: `id` (string)  
  **Response:**

```json
{
  "success": "boolean",
  "message": "string",
  "data": {
    "id": "string",
    "status": "string"
  }
}
```

#### GET /billing/invoices/overdue

**Path:** `/billing/invoices/overdue`  
**Method:** GET  
**Request:** None  
**Response:** Array of

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "dueDate": "Date",
  "daysOverdue": "number"
}
```

#### POST /billing/subscriptions

**Path:** `/billing/subscriptions`  
**Method:** POST  
**Request:**

- Body:

```json
{
  "tenantId": "string",
  "plan": "'basic' | 'pro' | 'enterprise'",
  "billingCycle": "'monthly' | 'yearly'"
}
```

**Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "tenantId": "string",
    "plan": "string",
    "status": "string",
    "price": "number",
    "currency": "string",
    "billingCycle": "string",
    "startDate": "Date",
    "nextBillingDate": "Date"
  }
}
```

#### GET /billing/subscriptions/tenant/:tenantId

**Path:** `/billing/subscriptions/tenant/:tenantId`  
**Method:** GET  
**Request:**

- Path Parameter: `tenantId` (string)  
  **Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "tenantId": "string",
    "plan": "string",
    "status": "string",
    "price": "number",
    "currency": "string",
    "billingCycle": "string",
    "startDate": "Date",
    "nextBillingDate": "Date"
  }
}
```

or

```json
{
  "success": "boolean",
  "message": "string"
}
```

#### PUT /billing/subscriptions/:id

**Path:** `/billing/subscriptions/:id`  
**Method:** PUT  
**Request:**

- Path Parameter: `id` (string)
- Body:

```json
{
  "plan": "'basic' | 'pro' | 'enterprise'", // optional
  "billingCycle": "'monthly' | 'yearly'" // optional
}
```

**Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "plan": "string",
    "billingCycle": "string",
    "nextBillingDate": "Date"
  }
}
```

#### DELETE /billing/subscriptions/:id

**Path:** `/billing/subscriptions/:id`  
**Method:** DELETE  
**Request:**

- Path Parameter: `id` (string)  
  **Response:**

```json
{
  "success": "boolean",
  "data": {
    "id": "string",
    "status": "string",
    "endDate": "Date"
  }
}
```

#### POST /billing/subscriptions/generate-invoices

**Path:** `/billing/subscriptions/generate-invoices`  
**Method:** POST  
**Request:** None  
**Response:**

```json
{
  "success": "boolean",
  "data": [
    {
      "id": "string",
      "tenantId": "string",
      "amount": "number",
      "billingPeriodStart": "Date",
      "billingPeriodEnd": "Date",
      "dueDate": "Date"
    }
  ]
}
```

### GraphQL Resolvers

#### Query: invoice

**Name:** `invoice`  
**Request:** `id: ID`  
**Response:**

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "billingPeriodStart": "Date",
  "billingPeriodEnd": "Date",
  "dueDate": "Date",
  "isOverdue": "boolean",
  "outstandingAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Query: invoices

**Name:** `invoices`  
**Request:** `tenantId: string`  
**Response:** Array of

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "billingPeriodStart": "Date",
  "billingPeriodEnd": "Date",
  "dueDate": "Date",
  "isOverdue": "boolean",
  "outstandingAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Query: pendingInvoices

**Name:** `pendingInvoices`  
**Request:** `tenantId: string`  
**Response:** Array of

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "billingPeriodStart": "Date",
  "billingPeriodEnd": "Date",
  "dueDate": "Date",
  "isOverdue": "boolean",
  "outstandingAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Query: overdueInvoices

**Name:** `overdueInvoices`  
**Request:** None  
**Response:** Array of

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "billingPeriodStart": "Date",
  "billingPeriodEnd": "Date",
  "dueDate": "Date",
  "isOverdue": "boolean",
  "outstandingAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Query: payments

**Name:** `payments`  
**Request:** `tenantId: string`  
**Response:** Array of

```json
{
  "id": "string",
  "invoiceId": "string",
  "amount": "number",
  "currency": "string",
  "paymentMethod": "string",
  "paymentDate": "Date",
  "status": "string",
  "transactionId": "string",
  "displayAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Query: invoicePayments

**Name:** `invoicePayments`  
**Request:** `invoiceId: string`  
**Response:** Array of

```json
{
  "id": "string",
  "invoiceId": "string",
  "amount": "number",
  "currency": "string",
  "paymentMethod": "string",
  "paymentDate": "Date",
  "status": "string",
  "transactionId": "string",
  "displayAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Mutation: generateInvoice

**Name:** `generateInvoice`  
**Request:** `input: GenerateInvoiceInput`  
**Response:**

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "billingPeriodStart": "Date",
  "billingPeriodEnd": "Date",
  "dueDate": "Date",
  "isOverdue": "boolean",
  "outstandingAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Mutation: processPayment

**Name:** `processPayment`  
**Request:** `input: ProcessPaymentInput`  
**Response:**

```json
{
  "id": "string",
  "invoiceId": "string",
  "amount": "number",
  "currency": "string",
  "paymentMethod": "string",
  "paymentDate": "Date",
  "status": "string",
  "transactionId": "string",
  "displayAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Mutation: cancelInvoice

**Name:** `cancelInvoice`  
**Request:** `input: CancelInvoiceInput`  
**Response:**

```json
{
  "id": "string",
  "tenantId": "string",
  "amount": "number",
  "currency": "string",
  "status": "string",
  "billingPeriodStart": "Date",
  "billingPeriodEnd": "Date",
  "dueDate": "Date",
  "isOverdue": "boolean",
  "outstandingAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Mutation: refundPayment

**Name:** `refundPayment`  
**Request:** `input: RefundPaymentInput`  
**Response:**

```json
{
  "id": "string",
  "invoiceId": "string",
  "amount": "number",
  "currency": "string",
  "paymentMethod": "string",
  "paymentDate": "Date",
  "status": "string",
  "transactionId": "string",
  "displayAmount": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Storage Module

### HTTP Controllers

#### GET /storage/health

**Path:** `/storage/health`  
**Method:** GET  
**Request:** None  
**Guards:** AuthGuard  
**Response:**

```json
{
  "status": "string",
  "message": "string",
  "features": "string[]",
  "bucket": "string",
  "endpoint": "string"
}
```

#### POST /storage/upload

**Path:** `/storage/upload`  
**Method:** POST  
**Request:** Multipart form data (file upload), request (user/tenant context)  
**Guards:** AuthGuard  
**Response:**

```json
{
  "success": "boolean",
  "data": "any",
  "progressKey": "string"
}
```

or error response

#### GET /storage/upload/progress/:progressKey

**Path:** `/storage/upload/progress/:progressKey`  
**Method:** GET  
**Request:**

- Path Parameter: `progressKey` (string)  
  **Guards:** AuthGuard  
  **Response:**

```json
{
  "loaded": "number",
  "total": "number",
  "percentage": "number",
  "completed": "boolean"
}
```

or HttpException

#### GET /storage/download/:path

**Path:** `/storage/download/:path`  
**Method:** GET  
**Request:**

- Path Parameter: `path` (string), request (user/tenant context)  
  **Guards:** AuthGuard  
  **Response:** Streamed file (Readable stream)

#### DELETE /storage/:path

**Path:** `/storage/:path`  
**Method:** DELETE  
**Request:**

- Path Parameter: `path` (string), request (user/tenant context)  
  **Guards:** AuthGuard  
  **Response:**

```json
{
  "success": "boolean"
}
```

or HttpException

#### GET /storage/files/:path

**Path:** `/storage/files/:path`  
**Method:** GET  
**Request:**

- Path Parameter: `path` (string), request (user/tenant context)  
  **Guards:** AuthGuard  
  **Response:**

```json
{
  "path": "string",
  "size": "number",
  "mimeType": "string",
  "uploadedAt": "Date"
}
```

or HttpException

(Note: No GraphQL resolvers for Storage module.)
