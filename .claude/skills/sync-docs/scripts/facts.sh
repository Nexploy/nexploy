#!/usr/bin/env bash
# Recomputes every documentable fact from the Nexploy source of truth.
# Output is a stable, greppable report — this is the ground truth the docs and
# the website are audited against. No network, no writes.
#
#   ./facts.sh            full report
#   ./facts.sh <section>  one section (git-providers, nodes, node-config, mcp, ...)

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_roots

WANT="${1:-all}"
want() { [ "$WANT" = "all" ] || [ "$WANT" = "$1" ]; }
section() { want "$1" && printf '\n## %s\n' "$1"; }

# Members of a Prisma enum, one per line.
prisma_enum() {
    local file="$1" name="$2"
    have "$file" || return 0
    awk -v n="$name" '
        $0 ~ "^enum "n" \\{" { inside = 1; next }
        inside && /^}/ { exit }
        inside && $1 ~ /^[A-Z][A-Z_0-9]*$/ { print $1 }
    ' "$file"
}

# Top-level keys of `export const <name> = z.object({ ... })`, tolerating the
# `= z\n  .object({` and `.refine(...)` shapes used in nodeConfigs.schema.ts.
schema_keys() {
    local file="$1" name="$2"
    have "$file" || return 0
    awk -v n="$name" '
        $0 ~ "^export const "n" =" { inside = 1; depth = 0; opened = 0 }
        !inside { next }
        {
            line = $0
            gsub(/[^{}]/, "", line)
            before = depth
            for (i = 1; i <= length(line); i++) {
                c = substr(line, i, 1)
                if (c == "{") depth++
                else depth--
            }
            if (depth > 0) opened = 1
            if (before == 1 && $0 ~ /^[ \t]+[a-zA-Z_][a-zA-Z0-9_]*:/) {
                key = $1; sub(/:.*/, "", key); print key
            }
            if (opened && depth <= 0) { inside = 0 }
        }
    ' "$file"
}

# ---------------------------------------------------------------- repo state

if want repo; then
    section repo
    echo "app_head=$(git -C "$APP_ROOT" rev-parse --short HEAD 2>/dev/null)"
    echo "app_head_date=$(git -C "$APP_ROOT" log -1 --format=%cs 2>/dev/null)"
    echo "app_branch=$(git -C "$APP_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)"
    echo "app_last_tag=$(git -C "$APP_ROOT" describe --tags --abbrev=0 2>/dev/null || echo none)"
    echo "app_version=$(node -p "require('$APP_ROOT/apps/nexploy/package.json').version" 2>/dev/null || echo unknown)"
    echo "cli_version=$(node -p "require('$CLI_ROOT/package.json').version" 2>/dev/null || echo unknown)"
    echo "website_head=$(git -C "$WEBSITE_ROOT" rev-parse --short HEAD 2>/dev/null)"
    echo "docs_head=$(git -C "$DOCS_ROOT" rev-parse --short HEAD 2>/dev/null)"
fi

# ------------------------------------------------------------- git providers

if want git-providers; then
    section git-providers
    providers=$(prisma_enum "$PRISMA_MODELS/oauthGit.prisma" GitProviderType)
    echo "count=$(echo "$providers" | grep -c .)"
    echo "enum=$(echo "$providers" | tr '\n' ' ')"
    schema_dir="$APP_ROOT/packages/schemas-zod/src/git"
    for dir in "$NEXPLOY_SRC/services/git/providers"/*/; do
        [ -d "$dir" ] || continue
        name=$(basename "$dir")
        setup="$schema_dir/${name}Setup.schema.ts"
        selfhosted=no
        if grep -qs 'baseUrl: z.url()' "$setup"; then
            selfhosted=required
        elif grep -qs 'baseUrl' "$setup"; then
            selfhosted=optional
        fi
        webhook=no
        grep -qs 'createWebhook' "$dir$name.adapter.ts" && webhook=yes
        fields=$(grep -oE '^\s+[a-zA-Z]+: z\.' "$setup" 2>/dev/null | sed 's/: z\.//; s/ //g' | tr '\n' ',' | sed 's/,$//')
        echo "adapter:$name baseUrl=$selfhosted createWebhook=$webhook setupFields=${fields:-n/a}"
    done
    echo "setup_actions=$(ls "$NEXPLOY_SRC/actions/git"/save*Provider.action.ts 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ' ')"
    echo "webhook_routes=$(find "$NEXPLOY_SRC/app/api" -path '*webhook*' -name 'route.ts' 2>/dev/null | sed "s|$NEXPLOY_SRC/app/api/||" | tr '\n' ' ')"
fi

# ------------------------------------------------------------- pipeline nodes

if want nodes; then
    section nodes
    ids=$(find "$NODES_SRC" -mindepth 1 -maxdepth 1 -type d ! -name registry -exec basename {} \; | sort)
    echo "count=$(echo "$ids" | grep -c .)"
    echo "categories_by_count:"
    grep -h "category: '" "$NODES_SRC"/*/node.ts |
        sed "s/.*category: '\([a-z]*\)'.*/\1/" | sort | uniq -c |
        awk '{ printf "  %s=%s\n", $2, $1 }'
    echo "registered_in_descriptors=$(grep -c "/node';" "$NODES_SRC/registry/descriptors.ts" 2>/dev/null)"
    echo "registered_in_server=$(grep -c "/executor';" "$NODES_SRC/registry/server.ts" 2>/dev/null)"
    echo "registered_in_client=$(grep -c "/Config';" "$NODES_SRC/registry/client.ts" 2>/dev/null)"
    echo "registered_in_messages=$(grep -c "\.\./[a-z0-9-]*/locales/en.json';" "$NODES_SRC/registry/messages.ts" 2>/dev/null)"
    echo "ids:"
    echo "$ids" | sed 's/^/  /'
fi

if want node-config; then
    section node-config
    schema_file="$NODE_CORE_SRC/schemas/nodeConfigs.schema.ts"
    for f in "$NODES_SRC"/*/node.ts; do
        [ -f "$f" ] || continue
        id=$(basename "$(dirname "$f")")
        schema=$(grep -m1 'configSchema:' "$f" | sed 's/.*configSchema: *//; s/,.*//')
        case "$schema" in
        "" | z.object* | undefined) echo "$id: (no schema)" ; continue ;;
        esac
        keys=$(schema_keys "$schema_file" "$schema" | tr '\n' ' ')
        echo "$id [$schema]: ${keys:-(empty)}"
    done
fi

# ------------------------------------------------------------------ mcp tools

if want mcp; then
    section mcp
    total=0
    for f in "$MCP_DIR"/*.group.ts; do
        [ -f "$f" ] || continue
        n=$(grep -c 'server\.registerTool(' "$f")
        total=$((total + n))
        echo "group:$(basename "$f" .group.ts)=$n"
    done
    echo "groups=$(ls "$MCP_DIR"/*.group.ts 2>/dev/null | grep -c .)"
    echo "tools=$total"
    echo "registered_in_index=$(grep -c 'Group,' "$NEXPLOY_SRC/lib/ai/mcp/index.ts" 2>/dev/null)"
    echo "tool_names:"
    awk '
        /server\.registerTool\(/ {
            line = $0
            if (line !~ /'"'"'/) { getline line }
            if (match(line, /'"'"'[^'"'"']+'"'"'/))
                print "  " substr(line, RSTART + 1, RLENGTH - 2)
        }
    ' "$MCP_DIR"/*.group.ts | sort
fi

# ------------------------------------------------------------------------- ai

if want ai; then
    section ai
    echo "providers=$(prisma_enum "$PRISMA_MODELS/aiConfig.prisma" Provider | tr '\n' ' ')"
    models_route="$NEXPLOY_SRC/app/api/ai/models/[provider]/route.ts"
    echo "model_list_source=$(have "$models_route" && echo 'fetched live from each provider API' || echo unknown)"
    echo "model_fetchers=$(grep -oE 'async function fetch[A-Za-z]+Models' "$models_route" 2>/dev/null | sed 's/async function fetch//; s/Models//' | tr '\n' ' ')"
    echo "assistant_tool_permissions=$(grep -q 'guardDestructive' "$NEXPLOY_SRC/lib/ai/mcp/helpers.ts" && echo 'destructive tools require confirmation' || echo unknown)"
fi

# ------------------------------------------------------------------ security

if want security; then
    section security
    echo "encryption_algorithm=$(grep -m1 "ALGORITHM = " "$NEXPLOY_SRC/lib/encryption.ts" | sed "s/.*'\(.*\)'.*/\1/")"
    echo "encryption_kdf=$(grep -m1 -o 'scryptSync\|pbkdf2Sync\|createHash' "$NEXPLOY_SRC/lib/encryption.ts")"
    echo "instance_roles=$(grep -m1 'export type Role' "$NEXPLOY_SRC/lib/auth/permissions.ts" | sed "s/.*= //; s/;//; s/'//g; s/ | / /g")"
    echo "org_roles=$(grep -m1 'export type OrgRole' "$NEXPLOY_SRC/lib/auth/orgPermissions.ts" | sed "s/.*= //; s/;//; s/'//g; s/ | / /g")"
    echo "default_role=$(grep -m1 'defaultRole:' "$NEXPLOY_SRC/lib/auth/permissions.ts" | sed "s/.*defaultRole: *'\(.*\)'.*/\1/")"
    echo "auth_plugins=$(awk '/plugins: \[/,/^    \],/' "$NEXPLOY_SRC/lib/auth/auth.ts" | grep -oE '^\s+[a-zA-Z]+\(' | tr -d ' (' | tr '\n' ' ')"
    echo "email_password_signup_disabled=$(grep -q 'disableSignUp: true' "$NEXPLOY_SRC/lib/auth/auth.ts" && echo yes || echo no)"
    echo "social_sign_in_providers=$(grep -m1 'socialProviders' "$NEXPLOY_SRC/lib/auth/auth.ts" >/dev/null 2>&1 && echo configured || echo none)"
    echo "two_factor=$(grep -q 'twoFactor(' "$NEXPLOY_SRC/lib/auth/auth.ts" && echo yes || echo no)"
    echo "api_keys=$(grep -q 'apiKey(' "$NEXPLOY_SRC/lib/auth/auth.ts" && echo yes || echo no)"
    echo "session_expires_seconds=$(grep -A2 'session: {' "$NEXPLOY_SRC/lib/auth/auth.ts" | grep -m1 'expiresIn' | sed 's/[^0-9*]*//; s/,$//')"
fi

# ----------------------------------------------------------------- deployment

if want install; then
    section install
    if have "$INSTALL_SH"; then
        echo "containers=$(grep -o '\--name nexploy_[a-z_]*' "$INSTALL_SH" | sed 's/--name //' | sort -u | tr '\n' ' ')"
        echo "container_count=$(grep -c 'docker run --detach' "$INSTALL_SH")"
        echo "images:"
        grep -oE '^readonly IMG_[A-Z_]+="[^"]+"' "$INSTALL_SH" | sed 's/^readonly /  /'
        echo "subcommands=$(awk '/case .*in/,/esac/' "$INSTALL_SH" | grep -oE '^\s+[a-z-]+\)' | tr -d ' )' | sort -u | tr '\n' ' ')"
        echo "published_ports=$(grep -oE '\--publish [0-9.]+:[0-9]+[0-9:/a-z]*|--publish [0-9]+:[0-9]+[/a-z]*' "$INSTALL_SH" | sed 's/--publish //' | sort -u | tr '\n' ' ')"
        echo "host_config_dir=$(grep -m1 -oE 'NEXPLOY_DIR:-[^}]+' "$INSTALL_SH" | sed 's/.*:-//')"
        echo "host_state_files=$(grep -oE '\$\{?CONFIG_DIR\}?/[a-zA-Z._-]+' "$INSTALL_SH" | sed 's|.*/||' | sort -u | tr '\n' ' ')"
        echo "installs_docker_if_missing=$(grep -q 'get.docker.com' "$INSTALL_SH" && echo yes || echo no)"
        echo "no_domain_mode=$(grep -q 'NEXPLOY_NO_DOMAIN' "$INSTALL_SH" && echo yes || echo no)"
    else
        echo "install.sh not found at $INSTALL_SH"
    fi
    echo "traefik_image_prod=$(grep -m1 -o 'traefik:v[0-9.]*' "$APP_ROOT/infra/docker/docker-compose.prod.yml" 2>/dev/null)"
    echo "traefik_image_dev=$(grep -m1 -o 'traefik:v[0-9.]*' "$APP_ROOT/infra/docker/docker-compose.dev.yml" 2>/dev/null)"
    echo "node_engine=$(node -p "require('$APP_ROOT/package.json').engines?.node ?? 'unset'" 2>/dev/null)"
    echo "package_manager=$(node -p "require('$APP_ROOT/package.json').packageManager ?? 'unset'" 2>/dev/null)"
fi

if want env-vars; then
    section env-vars
    echo "# read by the code (process.env.X)"
    grep -rhoE 'process\.env\.[A-Z][A-Z0-9_]*' \
        "$NEXPLOY_SRC" "$APP_ROOT/apps/docker-api/src" "$APP_ROOT/apps/nexploy/server.ts" 2>/dev/null |
        sed 's/process\.env\.//' | sort -u | sed 's/^/  /'
    if have "$INSTALL_SH"; then
        echo "# injected by install.sh (--env X=)"
        grep -oE '\--env [A-Z][A-Z0-9_]*' "$INSTALL_SH" | sed 's/--env /  /' | sort -u
    fi
fi

# ------------------------------------------------------------------- product

if want product; then
    section product
    echo "docker_connection_types=$(prisma_enum "$PRISMA_MODELS/environment.prisma" DockerConnectionType | tr '\n' ' ')"
    echo "build_statuses=$(prisma_enum "$APP_ROOT/apps/nexploy/prisma/models/pipeline.prisma" BuildStatus | tr '\n' ' ')"
    echo "backup_frequencies=$(prisma_enum "$PRISMA_MODELS/backupSchedule.prisma" Frequency | tr '\n' ' ')"
    echo "cert_types=$(prisma_enum "$PRISMA_MODELS/sslCertificate.prisma" CertType | tr '\n' ' ')"
    echo "pipeline_templates=$(grep -oE "^\s+id: '[a-z-]+'" "$NEXPLOY_SRC/components/pipeline/nodes/template/pipelineTemplates.ts" 2>/dev/null | sed "s/.*'\(.*\)'/\1/" | tr '\n' ' ')"
    echo "prisma_models=$(grep -h '^model ' "$PRISMA_MODELS"/*.prisma 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"
    echo "admin_sections=$(ls "$NEXPLOY_SRC/app/[locale]/(app)/admin" 2>/dev/null | tr '\n' ' ')"
    echo "app_pages:"
    find "$NEXPLOY_SRC/app/[locale]/(app)" -name 'page.tsx' 2>/dev/null |
        sed "s|$NEXPLOY_SRC/app/\[locale\]/(app)/||; s|/page.tsx||" | sort | sed 's/^/  /'
    echo "cleanup_targets=$(grep -oE '^\s+clean[A-Za-z]+' "$PRISMA_MODELS/cleanupSettings.prisma" 2>/dev/null | tr -d ' ' | tr '\n' ' ')"
    echo "inngest_functions=$(ls "$NEXPLOY_SRC/inngest/functions" 2>/dev/null | tr '\n' ' ')"
    echo "docker_api_routes=$(ls "$APP_ROOT/apps/docker-api/src/routes" 2>/dev/null | tr '\n' ' ')"
    echo "sse_channels=$(grep -rhoE "'(containers|images|volumes|networks|docker|swarm|requests|builds|logs|events|traefik)[a-zA-Z-]*'" "$NEXPLOY_SRC/stores" 2>/dev/null | tr -d "'" | sort -u | tr '\n' ' ')"
    echo "locales=$(ls "$APP_ROOT/packages/i18n/locales" 2>/dev/null | tr '\n' ' ')"
fi

if want cli; then
    section cli
    if have "$CLI_ROOT/src"; then
        echo "version=$(node -p "require('$CLI_ROOT/package.json').version" 2>/dev/null)"
        echo "bin=$(node -p "Object.keys(require('$CLI_ROOT/package.json').bin ?? {}).join(' ')" 2>/dev/null)"
        echo "commands:"
        grep -rhoE "\.command\('[^']+'\)" "$CLI_ROOT/src" 2>/dev/null | sed "s/.*'\(.*\)'.*/  \1/" | sort -u
    else
        echo "cli repo not found at $CLI_ROOT"
    fi
fi

want all && printf '\n'
exit 0
