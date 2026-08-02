#!/usr/bin/env bash
# Turns "what changed in the app repo" into "what prose has to be re-read".
#
#   ./changed.sh                 since the last recorded sync (falls back to the last tag)
#   ./changed.sh v0.1.0          since a tag, sha or branch
#   ./changed.sh v0.1.0 v0.2.0   between two refs
#   ./changed.sh --record        stamp the current app HEAD as synced in website/ and docs/
#   ./changed.sh --status        show what each target repo was last synced against
#
# The routing table below is the whole point: a changed source path maps to the
# pages that assert something about it. Extend it whenever a new surface appears.

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_roots

STAMP=.docs-sync.json

read_stamp() {
    local repo="$1"
    [ -f "$repo/$STAMP" ] || return 1
    grep -o '"appCommit"[^,}]*' "$repo/$STAMP" | sed 's/.*: *"//; s/"//'
}

write_stamp() {
    local repo="$1" sha="$2"
    [ -d "$repo" ] || return 0
    cat >"$repo/$STAMP" <<EOF
{
  "appCommit": "$sha",
  "appTag": "$(git -C "$APP_ROOT" describe --tags --abbrev=0 2>/dev/null || echo null)",
  "syncedAt": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
}
EOF
    echo "recorded $(basename "$repo")/$STAMP → $sha"
}

case "${1:-}" in
--record)
    sha=$(git -C "$APP_ROOT" rev-parse HEAD)
    write_stamp "$WEBSITE_ROOT" "$sha"
    write_stamp "$DOCS_ROOT" "$sha"
    exit 0
    ;;
--status)
    for repo in "$WEBSITE_ROOT" "$DOCS_ROOT"; do
        name=$(basename "$repo")
        if sha=$(read_stamp "$repo"); then
            short=$(git -C "$APP_ROOT" rev-parse --short "$sha" 2>/dev/null || echo "$sha")
            behind=$(git -C "$APP_ROOT" rev-list --count "$sha..HEAD" 2>/dev/null || echo '?')
            echo "$name: synced at $short — $behind app commits behind"
        else
            echo "$name: never synced (no $STAMP)"
        fi
    done
    exit 0
    ;;
esac

FROM="${1:-}"
TO="${2:-HEAD}"

if [ -z "$FROM" ]; then
    FROM=$(read_stamp "$DOCS_ROOT" || read_stamp "$WEBSITE_ROOT" || true)
    [ -n "$FROM" ] && echo "# range from the recorded sync stamp"
fi
if [ -z "$FROM" ]; then
    FROM=$(git -C "$APP_ROOT" describe --tags --abbrev=0 2>/dev/null)
    [ -n "$FROM" ] && echo "# no sync stamp — falling back to the last tag"
fi
if [ -z "$FROM" ]; then
    FROM=$(git -C "$APP_ROOT" rev-list --max-count=20 HEAD | tail -1)
    echo "# no tag either — falling back to the last 20 commits"
fi

git -C "$APP_ROOT" rev-parse --verify --quiet "$FROM" >/dev/null || die "unknown ref: $FROM"

echo "range: $FROM..$TO  ($(git -C "$APP_ROOT" rev-list --count "$FROM..$TO") commits)"

echo
echo "== commits"
git -C "$APP_ROOT" log --oneline --no-decorate "$FROM..$TO" | sed 's/^/  /'

echo
echo "== changed files"
git -C "$APP_ROOT" diff --name-status "$FROM..$TO" | sed 's/^/  /'

CHANGED=$(git -C "$APP_ROOT" diff --name-only "$FROM..$TO")

echo
echo "== routed prose targets"

# route <glob> <what changed> <pages to re-read>
route() {
    local pattern="$1" subject="$2" targets="$3"
    echo "$CHANGED" | grep -qE "$pattern" || return 0
    echo "  ▸ $subject"
    echo "$targets" | tr '|' '\n' | sed 's/^/      /'
    echo "$CHANGED" | grep -E "$pattern" | sed 's/^/      · /' | head -8
}

route 'prisma/models/oauthGit|services/git/providers|actions/git/|schemas-zod/src/git/|app/api/webhooks' \
    'Git providers / webhooks' \
    'docs: features/git-integration, index, getting-started/configuration, security/authentication|web: how-it-works, faq, proof (provider count), lib/site.ts (stack), app/layout.tsx (meta), app/privacy (subprocessors)'

route 'components/pipeline/nodes/manifests|schemas-zod/src/pipeline/nodeConfigs|typescript-interface/src/pipeline' \
    'Pipeline nodes (ids, categories, config keys)' \
    'docs: pipelines/node-types, pipelines/visual-editor, core-concepts/build-pipeline|web: lib/pipeline.ts (counts per category), pipeline.tsx, comparison.tsx, faq.tsx, proof.tsx'

route 'lib/ai/mcp|app/api/mcp' \
    'MCP tools / groups' \
    'docs: features/mcp-server, features/ai-assistant|web: assistant.tsx (tool group table, tool total)'

route 'prisma/models/aiConfig|app/api/ai/' \
    'AI providers / models' \
    'docs: features/ai-assistant|web: assistant.tsx (provider chips)'

route 'lib/auth/|lib/encryption|prisma/models/user|prisma/models/organization' \
    'Auth, roles, encryption' \
    'docs: security/authentication, security/api-keys, core-concepts/organizations, reference/environment-variables|web: security.tsx'

route 'infra/docker|apps/nexploy/Dockerfile|apps/docker-api/Dockerfile' \
    'Runtime images / compose topology' \
    'docs: getting-started/installation, getting-started/prerequisites, reference/architecture|web: faq.tsx (container list), final-cta.tsx, hero.tsx'

route 'prisma/models/environment|prisma/models/deploymentStage|prisma/models/version' \
    'Environments, stages, versions' \
    'docs: core-concepts/environments, core-concepts/versions, core-concepts/repositories|web: stages.tsx'

route 'prisma/models/backupSchedule|prisma/models/bucketStorage|inngest/functions/backup' \
    'Backups' \
    'docs: features/backups|web: fleet.tsx (backup card)'

route 'prisma/models/cleanupSettings|inngest/functions/dockerCleanup' \
    'Scheduled cleanup' \
    'docs: features/cleanup|web: fleet.tsx (cleanup card)'

route 'prisma/models/dockerRegistry|services/registry' \
    'Docker registries' \
    'docs: features/registries|web: fleet.tsx (registries card)'

route 'prisma/models/cloudflare|prisma/models/sslCertificate|lib/traefik' \
    'Domains, SSL, Cloudflare DNS' \
    'docs: networking/traefik-ssl, networking/domains, networking/cloudflare|web: fleet.tsx (domains card), live.tsx'

route 'apps/docker-api/src/routes/swarm|swarm' \
    'Docker Swarm' \
    'docs: docker/swarm|web: fleet.tsx (services & nodes), comparison.tsx'

route 'apps/docker-api/src/routes|apps/docker-api/src/managers' \
    'docker-api surface (containers, images, volumes, networks, events)' \
    'docs: docker/*, features/monitoring, reference/architecture|web: fleet.tsx, live.tsx'

route 'inngest/functions/build|services/build' \
    'Build pipeline execution' \
    'docs: core-concepts/build-pipeline, features/monitoring|web: live.tsx, how-it-works.tsx'

route 'package.json|pnpm-workspace|turbo.json' \
    'Workspace scripts / engines' \
    'docs: reference/cli-commands, getting-started/installation, getting-started/prerequisites'

route 'app/\[locale\]/\(app\)/admin' \
    'Admin screens' \
    'docs: getting-started/configuration, features/*, security/*'

route 'packages/i18n/locales' \
    'User-facing strings (i18n)' \
    'docs: any page quoting UI labels — re-read screenshots/labels'

echo
echo "== reminder"
echo "  install.sh lives in the website repo ($WEB_SRC/public/install.sh)."
echo "  Check it separately when the runtime topology changes:"
git -C "$WEBSITE_ROOT" log --oneline -3 -- apps/web/public/install.sh 2>/dev/null | sed 's/^/    /'
exit 0
