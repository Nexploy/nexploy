#!/usr/bin/env bash
#
# Full-stack E2E orchestrator.
#
#   ./scripts/e2e.sh           # boot everything + run the Playwright suite + tear down
#   ./scripts/e2e.sh --ui      # same, Playwright UI mode (args passed through)
#   ./scripts/e2e.sh up        # only boot the stack (DB + DinD + nexploy + docker-api)
#   ./scripts/e2e.sh down      # tear the stack down
#
# Brings up an isolated stack so the front-end can exercise the WHOLE app,
# including everything served by docker-api:
#   - throwaway Postgres (5434)         — never touches dev data
#   - throwaway Docker-in-Docker (12375) — docker-api drives this, not the host Docker
#   - nexploy (3022) + docker-api (3300) wired together with the seeded API key
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/nexploy"
COMPOSE_FILE="$REPO_ROOT/infra/docker/docker-compose.test.yml"
LOG_DIR="$REPO_ROOT/.e2e-logs"

export DATABASE_URL="${E2E_DATABASE_URL:-postgresql://nexploy:nexploy@localhost:5434/nexploy_test}"
export NEXPLOY_PORT="${E2E_PORT:-3022}"
export NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-e2e}"
export DOCKER_API_PORT="${DOCKER_API_PORT:-3300}"
export NEXPLOY_API_URL="http://localhost:${NEXPLOY_PORT}"
export DOCKER_API_URL="http://localhost:${DOCKER_API_PORT}"

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

# Sample resources created directly on the DinD daemon so each Docker page in the
# UI has real, predictable data to display (proving the front -> docker-api path).
seed_dind() {
    local D="docker -H tcp://127.0.0.1:12375"
    echo "▶ Seeding DinD with sample resources…"
    $D pull alpine:latest >/dev/null 2>&1 || true
    $D rm -f e2e-sample-container e2e-actions-container >/dev/null 2>&1 || true
    $D run -d --name e2e-sample-container alpine:latest sleep 3600 >/dev/null 2>&1 || true
    $D run -d --name e2e-actions-container alpine:latest sleep 3600 >/dev/null 2>&1 || true
    $D volume create e2e-sample-volume >/dev/null 2>&1 || true
    $D network create e2e-sample-network >/dev/null 2>&1 || true
}

kill_port() {
    local port="$1"
    local pids
    pids="$(lsof -ti "tcp:${port}" 2>/dev/null || true)"
    [ -n "$pids" ] && kill $pids 2>/dev/null || true
}

wait_for() {
    local name="$1" url="$2" auth="${3:-}" tries=0
    echo "▶ Waiting for ${name}…"
    until curl -sf ${auth:+-H "Authorization: Bearer $auth"} "$url" >/dev/null 2>&1; do
        tries=$((tries + 1))
        if [ "$tries" -gt 120 ]; then
            echo "✗ ${name} did not become ready ($url)"
            return 1
        fi
        sleep 1
    done
    echo "✓ ${name} ready"
}

stack_up() {
    mkdir -p "$LOG_DIR"

    echo "▶ Spinning up throwaway Postgres + Docker-in-Docker…"
    compose down -v --remove-orphans >/dev/null 2>&1 || true
    compose up -d --wait

    seed_dind

    echo "▶ Applying migrations…"
    (cd "$APP_DIR" && pnpm exec prisma migrate deploy >/dev/null)

    echo "▶ Seeding (creates the docker-api API key + default environment)…"
    local seed_out
    seed_out="$(cd "$APP_DIR" && pnpm exec prisma db seed 2>&1)"
    API_KEY="$(printf '%s\n' "$seed_out" | grep -oE 'NEXPLOY_API_KEY=.*' | head -1 | cut -d= -f2- | tr -d '[:space:]')"
    if [ -z "${API_KEY:-}" ]; then
        echo "✗ Could not capture the seeded API key. Seed output:"
        printf '%s\n' "$seed_out"
        return 1
    fi
    export NEXPLOY_API_KEY="$API_KEY"
    export DOCKER_API_KEY="$API_KEY"

    echo "▶ Pointing the default Docker environment at the DinD daemon…"
    # Prisma 7 reads the datasource URL from prisma.config.ts (env DATABASE_URL).
    printf "UPDATE environment SET \"connectionType\"='TCP', host='127.0.0.1', port=12375, \"socketPath\"=NULL WHERE \"isDefault\"=true;" \
        | (cd "$APP_DIR" && pnpm exec prisma db execute --stdin)

    # Run each server from its own package dir (NOT `pnpm --filter` from root:
    # the repo root package is also named "nexploy", so a root filter would run
    # the root `turbo run dev` and start a conflicting second server).
    echo "▶ Starting nexploy (:$NEXPLOY_PORT)…"
    kill_port "$NEXPLOY_PORT"
    (cd "$APP_DIR" && pnpm dev >"$LOG_DIR/nexploy.log" 2>&1) &
    wait_for "nexploy" "$NEXPLOY_API_URL/signin"

    echo "▶ Starting docker-api (:$DOCKER_API_PORT)…"
    kill_port "$DOCKER_API_PORT"
    (cd "$REPO_ROOT/apps/docker-api" && PORT="$DOCKER_API_PORT" pnpm dev >"$LOG_DIR/docker-api.log" 2>&1) &
    # /api/system/df returning 200 proves docker-api -> DinD + auth all work.
    wait_for "docker-api" "$DOCKER_API_URL/api/system/df" "$API_KEY"
}

stack_down() {
    echo "▶ Tearing down stack…"
    kill_port "${NEXPLOY_PORT}"
    kill_port "${DOCKER_API_PORT}"
    compose down -v --remove-orphans
    echo "▶ Removing E2E Next.js build dir ($NEXT_DIST_DIR)…"
    rm -rf "$APP_DIR/$NEXT_DIST_DIR"
}

# Tears the stack down on exit while preserving the test exit code (for CI).
cleanup() {
    local code=$?
    stack_down || true
    exit "$code"
}

cmd="${1:-run}"
case "$cmd" in
    up)
        stack_up
        echo "✓ Stack ready. nexploy=$NEXPLOY_API_URL docker-api=$DOCKER_API_URL"
        ;;
    down)
        stack_down
        ;;
    run)
        trap cleanup EXIT
        stack_up
        shift || true
        echo "▶ Running Playwright…"
        (cd "$REPO_ROOT" && pnpm exec playwright test "$@")
        ;;
    *)
        echo "Usage: e2e.sh [run|up|down] [-- playwright args]"
        exit 1
        ;;
esac
