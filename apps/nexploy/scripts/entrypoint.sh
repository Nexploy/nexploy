#!/bin/sh
set -e

cd /app/apps/nexploy

# ---- Migrations ----
echo "Running database migrations..."
npx prisma migrate deploy
echo "Migrations completed."

# ---- Seed (recreates API key each time) ----
echo "Running database seed..."
SEED_OUTPUT=$(npx tsx prisma/seed.ts 2>&1) || true
echo "$SEED_OUTPUT"

# Extract API key and write to local temp file (served via /api/internal/docker-api-key)
API_KEY=$(echo "$SEED_OUTPUT" | grep "^NEXPLOY_API_KEY=" | cut -d'=' -f2-)

if [ -n "$API_KEY" ]; then
    echo "$API_KEY" > /tmp/nexploy-api-key
    chown nextjs:nodejs /tmp/nexploy-api-key
    echo "API key stored internally."
    # Export so the Next.js server process can use it for docker-api calls
    export DOCKER_API_KEY="$API_KEY"
else
    echo "ERROR: Failed to extract API key from seed output."
    exit 1
fi

# ---- Ensure deployer workdir is writable by nextjs ----
mkdir -p /tmp/deployer
chown nextjs:nodejs /tmp/deployer

# ---- Start server as nextjs user ----
echo "Starting Next.js server..."
exec su-exec nextjs node server.cjs
