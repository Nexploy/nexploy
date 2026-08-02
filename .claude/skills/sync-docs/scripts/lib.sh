#!/usr/bin/env bash
# Shared path resolution for the sync-docs scripts.
# Roots are derived from this file's own location, so the scripts work from any cwd.
# Every root can be overridden with an environment variable.

set -uo pipefail

_lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

APP_ROOT="${NEXPLOY_APP_ROOT:-$(cd "$_lib_dir/../../../.." && pwd)}"
WORKSPACE="${NEXPLOY_WORKSPACE:-$(dirname "$APP_ROOT")}"
WEBSITE_ROOT="${NEXPLOY_WEBSITE_ROOT:-$WORKSPACE/website}"
DOCS_ROOT="${NEXPLOY_DOCS_ROOT:-$WORKSPACE/docs}"
CLI_ROOT="${NEXPLOY_CLI_ROOT:-$WORKSPACE/cli}"

WEB_SRC="$WEBSITE_ROOT/apps/web"
DOCS_SRC="$DOCS_ROOT/content/docs"
NEXPLOY_SRC="$APP_ROOT/apps/nexploy/src"
# Pipeline nodes live in the sibling nexploy-nodes repository, one folder per node.
NODES_ROOT="${NEXPLOY_NODES_ROOT:-$WORKSPACE/nodes}"
NODES_SRC="$NODES_ROOT/packages/nodes/src"
NODE_CORE_SRC="$NODES_ROOT/packages/node-core/src"
MCP_DIR="$NEXPLOY_SRC/lib/ai/mcp/groups"
PRISMA_MODELS="$APP_ROOT/apps/nexploy/prisma/models"
INSTALL_SH="$WEB_SRC/public/install.sh"

have() { [ -e "$1" ]; }

die() {
    echo "sync-docs: $1" >&2
    exit 1
}

require_roots() {
    have "$NEXPLOY_SRC" || die "app repo not found at $APP_ROOT (set NEXPLOY_APP_ROOT)"
    have "$NODES_SRC" || die "nexploy-nodes not found at $NODES_ROOT (set NEXPLOY_NODES_ROOT)"
    have "$WEB_SRC" || echo "sync-docs: warning — website not found at $WEBSITE_ROOT" >&2
    have "$DOCS_SRC" || echo "sync-docs: warning — docs not found at $DOCS_ROOT" >&2
}

# All docs pages, default locale only (fr). One relative path per line.
docs_pages_fr() {
    have "$DOCS_SRC" || return 0
    find "$DOCS_SRC" -name '*.mdx' ! -name '*.en.mdx' | sed "s|$DOCS_SRC/||" | sort
}

# Every prose file the skill is responsible for, absolute paths.
content_files() {
    have "$DOCS_SRC" && find "$DOCS_SRC" -name '*.mdx'
    have "$WEB_SRC" && find "$WEB_SRC/components" "$WEB_SRC/app" -name '*.tsx' ! -path '*/.next/*' 2>/dev/null
    have "$WEB_SRC/lib" && find "$WEB_SRC/lib" -name '*.ts'
}
