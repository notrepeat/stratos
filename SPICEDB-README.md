# SpiceDB Setup for SaaS Enterprise

This guide explains how to set up SpiceDB for production authorization in your SaaS application.

## Prerequisites

- Docker and Docker Compose
- Node.js environment
- Access to the application repository

## Quick Start (Development)

For development, the system automatically falls back to mock permissions when SpiceDB is not available.

```bash
# The application will work without SpiceDB in development mode
npm run dev
```

## Production Setup

### 1. Start SpiceDB

```bash
# Start SpiceDB with Docker Compose
npm run spicedb:start

# Or manually:
docker-compose -f docker-compose.spicedb.yml up -d
```

### 2. Initialize Schema

```bash
# Apply the authorization schema to SpiceDB
npm run spicedb:init
```

This will:

- Read the schema from `src/core/config/spicedb/schema.zed`
- Apply it to your running SpiceDB instance
- Validate the schema deployment

### 3. Configure Environment

Add these environment variables to your `.env` file:

```env
# SpiceDB Configuration
SPICEDB_ENDPOINT=http://localhost:8443
SPICEDB_TOKEN=mypresharedkey
NODE_ENV=production
```

### 4. Verify Setup

```bash
# Check SpiceDB health
curl http://localhost:8443/v1/permissions/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mypresharedkey" \
  -d '{
    "resource": {"objectType": "tenant", "objectId": "test"},
    "permission": "read",
    "subject": {"object": {"objectType": "user", "objectId": "test-user"}}
  }'
```

## Schema Overview

The authorization schema defines:

### Resources

- **tenant**: Organizations in the SaaS
- **user**: Application users
- **invoice**: Billing invoices
- **payment**: Payment records

### Relations

- **admin**: Full access to resource
- **member**: Read access to resource
- **belongs_to**: Resource ownership

### Permissions

- **manage**: Full CRUD operations
- **read**: View access
- **update**: Modify access
- **delete**: Remove access
- **manage_billing**: Billing operations
- **invite_users**: User management

## API Usage

### Check Permissions

```bash
curl -X POST http://localhost:3000/api/permissions/check \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "tenant:tenant-id",
    "permission": "read"
  }'
```

### Manage Relationships

```bash
# Add user as tenant admin
curl -X POST http://localhost:3000/api/permissions/tenants/tenant-id/admins/user-id \
  -H "Authorization: Bearer admin-token"

# Remove user from tenant
curl -X DELETE http://localhost:3000/api/permissions/tenants/tenant-id/users/user-id \
  -H "Authorization: Bearer admin-token"
```

## Development vs Production

- **Development**: Uses mock permissions, no SpiceDB required
- **Production**: Requires SpiceDB running with schema deployed

The system automatically detects the environment and switches modes accordingly.

## Troubleshooting

### SpiceDB Connection Issues

1. Verify SpiceDB is running: `docker ps | grep spicedb`
2. Check logs: `docker logs spicedb-container`
3. Test connectivity: `curl http://localhost:8443/health`

### Permission Denied Errors

1. Check user relationships in SpiceDB
2. Verify schema is correctly deployed
3. Check application logs for detailed error messages

### Schema Deployment Issues

1. Ensure SpiceDB CLI is installed
2. Check schema file syntax
3. Verify SpiceDB endpoint and token are correct
