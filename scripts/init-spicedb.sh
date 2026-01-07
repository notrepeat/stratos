#!/bin/bash

# Script to initialize SpiceDB with schema for SaaS application

set -e

echo "🚀 Initializing SpiceDB schema..."

# Wait for SpiceDB to be ready
echo "⏳ Waiting for SpiceDB to be ready..."
sleep 10

# Read the schema file
SCHEMA_FILE="src/core/config/spicedb/schema.zed"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found: $SCHEMA_FILE"
    exit 1
fi

# Use the SpiceDB CLI to apply the schema
# Note: This requires spicedb CLI to be installed
# For production, you might want to use the REST API or gRPC client

echo "📝 Applying schema to SpiceDB..."
echo "⚠️  Note: This requires SpiceDB CLI. Install with: go install github.com/authzed/spicedb/cmd/spicedb@latest"

# For now, we'll document the commands that should be run:
echo ""
echo "🔧 Manual SpiceDB setup commands:"
echo "1. Start SpiceDB: docker-compose -f docker-compose.spicedb.yml up -d"
echo "2. Wait for it to be ready: sleep 10"
echo "3. Apply schema: spicedb import --endpoint=localhost:50051 --token=mypresharedkey --file=$SCHEMA_FILE"
echo "4. Verify: spicedb validate --endpoint=localhost:50051 --token=mypresharedkey --file=$SCHEMA_FILE"
echo ""

# Check if spicedb CLI is available
if command -v spicedb &> /dev/null; then
    echo "✅ SpiceDB CLI found, applying schema..."

    # Apply the schema
    spicedb import \
        --endpoint=localhost:50051 \
        --token=mypresharedkey \
        --file="$SCHEMA_FILE"

    echo "✅ Schema applied successfully!"

    # Validate the schema
    spicedb validate \
        --endpoint=localhost:50051 \
        --token=mypresharedkey \
        --file="$SCHEMA_FILE"

    echo "✅ Schema validation successful!"
else
    echo "⚠️  SpiceDB CLI not found. Please install it manually:"
    echo "   go install github.com/authzed/spicedb/cmd/spicedb@latest"
    echo ""
    echo "Then run this script again, or execute the commands above manually."
fi