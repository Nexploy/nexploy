#!/bin/sh
set -e

if [ -z "$NEXPLOY_API_KEY" ] && [ -z "$SELF_UPGRADE_TARGET_IMAGE" ]; then
    echo "Fetching API key from nexploy..."

    RETRIES=0
    MAX_RETRIES=30

    while [ "$RETRIES" -lt "$MAX_RETRIES" ]; do
        RESPONSE=$(wget -qO- --header="x-internal-secret: ${ENCRYPTION_KEY}" \
            "${NEXPLOY_API_URL}/api/internal/docker-api-key" 2>/dev/null) || true

        if echo "$RESPONSE" | grep -q '"key"'; then
            export NEXPLOY_API_KEY=$(echo "$RESPONSE" | sed 's/.*"key":"\([^"]*\)".*/\1/')
            echo "API key loaded from nexploy."
            break
        fi

        RETRIES=$((RETRIES + 1))
        [ $((RETRIES % 5)) -eq 0 ] && echo "  Still waiting... (${RETRIES}/${MAX_RETRIES})"
        sleep 2
    done

    if [ -z "$NEXPLOY_API_KEY" ]; then
        echo "ERROR: Failed to fetch API key after ${MAX_RETRIES} retries."
        exit 1
    fi
fi

exec node --no-deprecation dist/index.cjs
