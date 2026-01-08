# HTTP REST API Endpoints for Stratos SaaS Backend

This document provides a detailed overview of the HTTP REST API endpoints available in the Stratos SaaS application. It includes all controllers, their methods, request/response schemas, and authentication requirements.

## Authentication

Most endpoints require authentication via Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Some endpoints have additional permission requirements (Tenant Admin, Super Admin).

## API Endpoints

### Auth Controller (`/auth`)

#### POST `/auth/register`

Register a new user account.

**Request Body:**

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
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string"
  }
}
```

#### POST `/auth/login`

Authenticate user and get session token.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "tenantId": "string"
    }
  }
}
```

**Response (Failure):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### POST `/auth/logout`

Invalidate user session.

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "No token provided"
}
```

#### GET `/auth/me`

Get current user information.

**Headers:**

- `Authorization: Bearer <token>`

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "tenantId": "string"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Invalid token"
}
```

### Users Controller (`/users`)

_Requires Authentication_

#### POST `/users`

Create a new user.

**Request Body:**

```json
{
  "email": "string",
  "name": "string",
  "tenantId": "string"
}
```

**Response:** User object

#### GET `/users`

Get all users (filtered by tenant context).

**Response:** Array of User objects

#### GET `/users/:id`

Get user by ID.

**Response:** User object or `null`

#### GET `/users/email/:email`

Get user by email.

**Response:** User object or `null`

#### PUT `/users/:id`

Update user (self or tenant admin).

**Request Body:**

```json
{
  "name": "string (optional)"
}
```

**Response:** Updated User object

#### DELETE `/users/:id`

Delete user (tenant admin only).

**Response:**

```json
{
  "message": "User deleted"
}
```

### Tenants Controller (`/tenants`)

#### POST `/tenants`

Create a new tenant.

**Request Body:**

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
  "success": true,
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

#### GET `/tenants`

Get all tenants.

**Response:** Array of tenant summary objects:

```json
[{
  "id": "string",
  "name": "string",
  "slug": "string",
  "domain": "string",
  "status": "string",
  "adminEmail": "string",
  "isActive": boolean
}]
```

#### GET `/tenants/:id`

Get tenant by ID.

**Response:** Full tenant object with `databaseName`

#### GET `/tenants/slug/:slug`

Get tenant by slug.

**Response (Success):** Tenant object

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Tenant not found"
}
```

#### PUT `/tenants/:id`

Update tenant.

**Request Body:**

```json
{
  "name": "string (optional)",
  "slug": "string (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "domain": "string",
    "status": "string"
  }
}
```

#### DELETE `/tenants/:id`

Delete tenant.

**Response:**

```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

### Billing Controller (`/billing`)

_Requires Authentication_

#### POST `/billing/invoices/generate/:tenantId`

Generate monthly invoice for a tenant.

**Request Body:**

```json
{
  "billingPeriodStart": "string (ISO date)",
  "billingPeriodEnd": "string (ISO date)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "tenantId": "string",
    "amount": "number",
    "currency": "string",
    "status": "string",
    "billingPeriodStart": "string (ISO date)",
    "billingPeriodEnd": "string (ISO date)",
    "dueDate": "string (ISO date)"
  }
}
```

#### GET `/billing/invoices/tenant/:tenantId`

Get all invoices for a tenant.

**Response:** Array of invoice objects with additional computed fields

#### GET `/billing/invoices/tenant/:tenantId/pending`

Get pending invoices for a tenant.

**Response:** Array of simplified invoice objects

#### GET `/billing/invoices/:id`

Get invoice by ID.

**Response:** Full invoice object

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Invoice not found"
}
```

#### POST `/billing/payments`

Process a payment for an invoice.

**Request Body:**

```json
{
  "invoiceId": "string",
  "amount": "number",
  "paymentMethod": "stripe | paypal | bank_transfer | other",
  "transactionId": "string (optional)",
  "notes": "string (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "invoiceId": "string",
    "amount": "number",
    "currency": "string",
    "paymentMethod": "string",
    "paymentDate": "string (ISO date)",
    "status": "string",
    "transactionId": "string (optional)"
  }
}
```

#### GET `/billing/payments/tenant/:tenantId`

Get all payments for a tenant.

**Response:** Array of payment objects with `displayAmount`

#### GET `/billing/payments/invoice/:invoiceId`

Get payments for a specific invoice.

**Response:** Array of simplified payment objects

#### POST `/billing/invoices/:id/cancel`

Cancel an invoice.

**Response:**

```json
{
  "success": true,
  "message": "Invoice cancelled successfully",
  "data": {
    "id": "string",
    "status": "string"
  }
}
```

#### POST `/billing/payments/:id/refund`

Refund a payment.

**Response:**

```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "data": {
    "id": "string",
    "status": "string"
  }
}
```

#### GET `/billing/invoices/overdue`

Get all overdue invoices (admin endpoint).

**Response:** Array of overdue invoice objects with `daysOverdue`

#### POST `/billing/subscriptions`

Create subscription for a tenant.

**Request Body:**

```json
{
  "tenantId": "string",
  "plan": "basic | pro | enterprise",
  "billingCycle": "monthly | yearly"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "tenantId": "string",
    "plan": "string",
    "status": "string",
    "price": "number",
    "currency": "string",
    "billingCycle": "string",
    "startDate": "string (ISO date)",
    "nextBillingDate": "string (ISO date)"
  }
}
```

#### GET `/billing/subscriptions/tenant/:tenantId`

Get subscription for a tenant.

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "tenantId": "string",
    "plan": "string",
    "status": "string",
    "price": "number",
    "currency": "string",
    "billingCycle": "string",
    "startDate": "string (ISO date)",
    "nextBillingDate": "string (ISO date)"
  }
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Subscription not found"
}
```

#### PUT `/billing/subscriptions/:id`

Update subscription.

**Request Body:**

```json
{
  "plan": "basic | pro | enterprise (optional)",
  "billingCycle": "monthly | yearly (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "plan": "string",
    "billingCycle": "string",
    "nextBillingDate": "string (ISO date)"
  }
}
```

#### DELETE `/billing/subscriptions/:id`

Cancel subscription.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "string",
    "endDate": "string (ISO date)"
  }
}
```

#### POST `/billing/subscriptions/generate-invoices`

Generate invoices for due subscriptions.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "tenantId": "string",
      "amount": "number",
      "billingPeriodStart": "string (ISO date)",
      "billingPeriodEnd": "string (ISO date)"
    }
  ]
}
```

### Storage Controller (`/storage`)

_Requires Authentication_

#### GET `/storage/health`

Get storage health status.

**Response:**

```json
{
  "status": "string",
  "message": "string",
  "features": ["string"],
  "bucket": "string",
  "endpoint": "string"
}
```

#### POST `/storage/upload`

Upload file to storage.

**Content-Type:** `multipart/form-data`

**Body:** File upload with form data

**Rate Limit:** Max 5 concurrent uploads per tenant

**Response:** Upload result with progress tracking key

#### GET `/storage/upload/progress/:progressKey`

Get upload progress.

**Response:**

```json
{
  "loaded": "number",
  "total": "number",
  "percentage": "number"
}
```

#### GET `/storage/download/:path(*)`

Download file from storage.

**Response:** File stream

#### DELETE `/storage/:path(*)`

Delete file from storage.

**Response:** Success status

#### GET `/storage/files/:path(*)`

List files in storage path.

**Response:** File listing

### Permissions Controller (`/permissions`)

_Requires Authentication and Permission Guards_

#### GET `/permissions/user/:userId`

Get user permissions summary (Super Admin only).

**Response:**

```json
{
  "success": true,
  "data": {
    "permissions": ["string"]
  }
}
```

#### GET `/permissions/me`

Get current user permissions.

**Response:**

```json
{
  "success": true,
  "data": {
    "permissions": ["string"]
  }
}
```

#### POST `/permissions/tenants/:tenantId/users`

Add user to tenant (Tenant Admin only).

**Request Body:**

```json
{
  "userId": "string",
  "role": "admin | member (optional, defaults to member)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "string"
}
```

#### DELETE `/permissions/tenants/:tenantId/users/:userId`

Remove user from tenant (Tenant Admin only).

**Response:**

```json
{
  "success": true,
  "message": "string"
}
```

#### POST `/permissions/tenants/:tenantId/admins/:userId`

Make user tenant admin (Tenant Admin only).

**Response:**

```json
{
  "success": true,
  "message": "string"
}
```

#### DELETE `/permissions/tenants/:tenantId/admins/:userId`

Remove tenant admin privileges (Tenant Admin only).

**Response:**

```json
{
  "success": true,
  "message": "string"
}
```

#### POST `/permissions/check`

Check specific permission.

**Request Body:**

```json
{
  "resource": "string",
  "permission": "string",
  "userId": "string (optional, defaults to current user)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "resource": "string",
    "permission": "string",
    "userId": "string",
    "hasPermission": "boolean"
  }
}
```

#### POST `/permissions/resources`

Get accessible resources.

**Request Body:**

```json
{
  "resources": ["string"],
  "permission": "string",
  "userId": "string (optional, defaults to current user)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requested": ["string"],
    "accessible": ["string"],
    "permission": "string",
    "userId": "string"
  }
}
```

### Health Controller (`/health`)

#### GET `/health`

Basic health check.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "string (ISO date)",
  "service": "Stratos SaaS Backend"
}
```

#### GET `/health/tenants`

Tenants database health check.

**Response:**

```json
{
  "timestamp": "string (ISO date)",
  "summary": {
    "totalTenants": "number",
    "healthy": "number",
    "unhealthy": "number"
  },
  "tenants": [
    {
      "tenant": "string",
      "status": "healthy | unhealthy",
      "connections": "string (optional)",
      "error": "string (optional)"
    }
  ],
  "mainConnection": "boolean"
}
```

#### GET `/health/storage`

Storage health check.

**Response (Healthy):**

```json
{
  "status": "healthy",
  "timestamp": "string (ISO date)",
  "storage": "accessible"
}
```

**Response (Unhealthy):**

```json
{
  "status": "unhealthy",
  "timestamp": "string (ISO date)",
  "error": "string"
}
```

#### GET `/health/deep`

Comprehensive health check.

**Response:**

```json
{
  "status": "healthy | degraded",
  "timestamp": "string (ISO date)",
  "checks": {
    "tenants": { ... },
    "storage": { ... }
  }
}
```

### App Controller (`/`)

#### GET `/`

Root endpoint.

**Response:**

```json
{
  "message": "SaaS Template Running",
  "superadmin": "Check logs for creation"
}
```

## Notes

- All endpoints return JSON responses unless otherwise specified
- Authentication is required for most endpoints (except health checks and auth endpoints)
- Some endpoints have additional role-based permissions (Tenant Admin, Super Admin)
- File uploads use multipart/form-data encoding
- File downloads return binary streams
- Date fields are ISO 8601 formatted strings
- Success responses typically include `{ "success": true }`
- Error responses include `{ "success": false, "message": "..." }`
- Rate limiting applies to file uploads (5 concurrent per tenant)
- Tenant context is automatically applied based on authentication
