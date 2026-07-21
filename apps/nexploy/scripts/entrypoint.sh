#!/bin/sh
set -e

cd /app/apps/nexploy

export PATH="/app/migrate-tools/node_modules/.bin:$PATH"

# ---- Migrations ----
echo "Running database migrations..."
prisma migrate deploy
echo "Migrations completed."

# ---- Seed (Docker API key is created once in DB and reused on every subsequent boot) ----
echo "Running database seed..."
SEED_OUTPUT=$(tsx prisma/seed.ts 2>&1) || true
echo "$SEED_OUTPUT"

API_KEY=$(echo "$SEED_OUTPUT" | grep "^NEXPLOY_API_KEY=" | cut -d'=' -f2-)

if [ -z "$API_KEY" ]; then
    echo "ERROR: Failed to extract API key from seed output."
    exit 1
fi

export DOCKER_API_KEY="$API_KEY"

# ---- Ensure deployer workdir is writable by nextjs ----
mkdir -p /tmp/deployer
chown nextjs:nodejs /tmp/deployer

# ---- Ensure Traefik config dir is writable by nextjs ----
if [ -n "$TRAEFIK_SERVICE_DIR" ]; then
    mkdir -p "$TRAEFIK_SERVICE_DIR"
    chown -R nextjs:nodejs "$(dirname "$TRAEFIK_SERVICE_DIR")"
fi

# ---- Start server as nextjs user ----
echo "Starting Next.js server..."
exec su-exec nextjs node server.cjs
