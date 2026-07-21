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
KEY_FILE="${NEXPLOY_API_KEY_FILE:-/tmp/nexploy-api-key}"
rm -f "$KEY_FILE"
tsx prisma/seed.ts

if [ ! -s "$KEY_FILE" ]; then
    echo "ERROR: Failed to read API key from $KEY_FILE."
    exit 1
fi

export NEXPLOY_API_KEY="$(cat "$KEY_FILE")"
rm -f "$KEY_FILE"

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
