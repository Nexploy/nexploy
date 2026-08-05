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
NODES_SRC="$NODES_ROOT/src/nodes"
NODE_CORE_SRC="$NODES_ROOT/src/core"
MCP_DIR="$NEXPLOY_SRC/lib/ai/mcp/groups"
PRISMA_MODELS="$APP_ROOT/apps/nexploy/prisma/models"
INSTALL_SH="$WEB_SRC/public/install.sh"

DOCS_I18N="$DOCS_ROOT/lib/i18n.ts"

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

# Locale set of the docs site. Authoritative source is docs/lib/i18n.ts; when it is
# missing, the locales are recovered from the `page.<lang>.mdx` files on disk. Adding a
# language to i18n.ts is enough for every check below to start covering it.
docs_default_locale() {
    local from_config=''
    have "$DOCS_I18N" &&
        from_config=$(grep -m1 "defaultLanguage:" "$DOCS_I18N" | sed "s/.*defaultLanguage: *['\"]\([a-z-]*\)['\"].*/\1/")
    echo "${from_config:-fr}"
}

# Every locale declared for the docs, default one included, one per line.
docs_locales() {
    local default line
    default="$(docs_default_locale)"

    if have "$DOCS_I18N"; then
        line=$(grep -m1 "languages:" "$DOCS_I18N" | grep -oE "\[[^]]*\]" | grep -oE "[a-z][a-z-]*")
        if [ -n "$line" ]; then
            printf '%s\n' "$line" | sort -u
            return 0
        fi
    fi

    have "$DOCS_SRC" || {
        echo "$default"
        return 0
    }
    {
        echo "$default"
        find "$DOCS_SRC" -name '*.*.mdx' -exec basename {} \; |
            sed 's/\.mdx$//; s/.*\.//' | grep -E '^[a-z]{2}(-[a-z]{2})?$'
    } | sort -u
}

# Every locale except the default one, one per line.
docs_translation_locales() {
    local default
    default="$(docs_default_locale)"
    docs_locales | grep -vx "$default"
}

# All docs pages, default locale only. One relative path per line.
# A translated page is `<name>.<lang>.mdx`, so the default locale is every .mdx
# whose basename holds no extra dot — true for any language added later.
docs_pages_default() {
    have "$DOCS_SRC" || return 0
    find "$DOCS_SRC" -name '*.mdx' ! -name '*.*.mdx' | sed "s|$DOCS_SRC/||" | sort
}

# Every prose file the skill is responsible for, absolute paths.
content_files() {
    have "$DOCS_SRC" && find "$DOCS_SRC" -name '*.mdx'
    have "$WEB_SRC" && find "$WEB_SRC/components" "$WEB_SRC/app" -name '*.tsx' ! -path '*/.next/*' 2>/dev/null
    have "$WEB_SRC/lib" && find "$WEB_SRC/lib" -name '*.ts'
}
