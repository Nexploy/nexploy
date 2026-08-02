#!/usr/bin/env bash
# Audits the docs site and the marketing website against the app's source of truth.
# Reports only what a machine can prove; judgement calls are left to the caller.
#
#   ./drift.sh              every check, both targets
#   ./drift.sh --docs       docs repo only
#   ./drift.sh --website    website repo only
#   ./drift.sh <check>      one check (identifiers, counts, env-vars, providers,
#                           encryption, coverage, i18n, links, meta, versions)
#
# Exit code: 1 if any [FAIL] was printed, else 0.

. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
require_roots

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

TARGET=both
WANT=all
for arg in "$@"; do
    case "$arg" in
    --docs) TARGET=docs ;;
    --website) TARGET=website ;;
    --*) die "unknown flag $arg" ;;
    *) WANT="$arg" ;;
    esac
done

FAILED=0
want() { [ "$WANT" = "all" ] || [ "$WANT" = "$1" ]; }
do_docs() { [ "$TARGET" != "website" ] && have "$DOCS_SRC"; }
do_web() { [ "$TARGET" != "docs" ] && have "$WEB_SRC"; }
head2() { printf '\n== %s\n' "$1"; }
fail() {
    echo "[FAIL] $1"
    FAILED=1
}
warn() { echo "[WARN] $1"; }
ok() { echo "[ OK ] $1"; }

# ---------------------------------------------------------------- fact inputs

"$SCRIPTS_DIR/facts.sh" nodes | sed -n '/^ids:/,$p' | grep '^  ' | tr -d ' ' | sort >"$TMP/node-ids"
"$SCRIPTS_DIR/facts.sh" mcp | sed -n '/^tool_names:/,$p' | grep '^  ' | tr -d ' ' | sort >"$TMP/mcp-tools"
NODE_COUNT=$(grep -c . "$TMP/node-ids")
MCP_TOOLS=$(grep -c . "$TMP/mcp-tools")
MCP_GROUPS=$(ls "$MCP_DIR"/*.group.ts 2>/dev/null | grep -c .)
PROVIDER_COUNT=$("$SCRIPTS_DIR/facts.sh" git-providers | grep -m1 '^count=' | cut -d= -f2)
CONTAINER_COUNT=$("$SCRIPTS_DIR/facts.sh" install | grep -m1 '^container_count=' | cut -d= -f2)
CATEGORY_COUNT=$("$SCRIPTS_DIR/facts.sh" nodes | sed -n '/categories_by_count/,/^registered/p' | grep -c '^  [a-z]*=')
ALGO=$("$SCRIPTS_DIR/facts.sh" security | grep -m1 '^encryption_algorithm=' | cut -d= -f2)

# Prose files under audit, one path per line.
: >"$TMP/files"
do_docs && find "$DOCS_SRC" -name '*.mdx' >>"$TMP/files"
do_web && find "$WEB_SRC/components" "$WEB_SRC/app" "$WEB_SRC/lib" \
    \( -name '*.tsx' -o -name '*.ts' \) ! -path '*/.next/*' 2>/dev/null >>"$TMP/files"
FILE_COUNT=$(grep -c . "$TMP/files")
rel() { sed "s|$WORKSPACE/||"; }

echo "sync-docs drift report — $(date '+%Y-%m-%d %H:%M')"
echo "app $(git -C "$APP_ROOT" rev-parse --short HEAD 2>/dev/null) · $FILE_COUNT content files · target=$TARGET"

# ----------------------------------------------------- 1. stale node/tool ids

if want identifiers; then
    head2 "identifiers — node ids and MCP tool names cited in prose"

    cut -d- -f1 "$TMP/node-ids" | sort -u >"$TMP/node-verbs"
    grep -ohE '`[a-z][a-z0-9]*(-[a-z0-9]+)+`' $(cat "$TMP/files") 2>/dev/null |
        tr -d '`' | sort -u >"$TMP/kebab-cited"

    : >"$TMP/suspect"
    while read -r token; do
        [ -n "$token" ] || continue
        grep -qx "$token" "$TMP/node-ids" && continue
        grep -qx "${token%%-*}" "$TMP/node-verbs" || continue
        grep -qx "$token" "$SCRIPTS_DIR/../references/known-terms.txt" 2>/dev/null && continue
        echo "$token" >>"$TMP/suspect"
    done <"$TMP/kebab-cited"

    if [ -s "$TMP/suspect" ]; then
        while read -r token; do
            fail "\`$token\` reads like a pipeline node but no manifest defines it"
            grep -rl "\`$token\`" $(cat "$TMP/files") 2>/dev/null | rel | sed 's/^/         /'
        done <"$TMP/suspect"
    else
        ok "every node-shaped identifier in prose maps to a real manifest"
    fi

    mcp_pages=$(grep -rl 'MCP\|mcp' $(cat "$TMP/files") 2>/dev/null)
    if [ -n "$mcp_pages" ]; then
        grep -ohE '`[a-z][a-zA-Z0-9]+`' $mcp_pages 2>/dev/null | tr -d '`' |
            grep -E '[a-z][A-Z]' | sort -u >"$TMP/camel-cited"
        : >"$TMP/mcp-suspect"
        while read -r token; do
            [ -n "$token" ] || continue
            grep -qx "$token" "$TMP/mcp-tools" && continue
            grep -qx "$token" "$SCRIPTS_DIR/../references/known-terms.txt" 2>/dev/null && continue
            echo "$token" >>"$TMP/mcp-suspect"
        done <"$TMP/camel-cited"
        if [ -s "$TMP/mcp-suspect" ]; then
            warn "camelCase identifiers cited near MCP content that are not registered tools:"
            sed 's/^/         /' "$TMP/mcp-suspect"
        else
            ok "every camelCase identifier near MCP content is a registered tool"
        fi
    fi
fi

# ------------------------------------------------------- 2. numeric assertions

if want counts; then
    head2 "counts — numbers asserted in prose vs the code"

    check_count() {
        local label="$1" truth="$2" pattern="$3"
        local hits found=0
        hits=$(grep -rnoiE "[0-9]+ ($pattern)" $(cat "$TMP/files") 2>/dev/null)
        [ -n "$hits" ] || return 0
        echo "$hits" | while IFS= read -r hit; do
            local n
            n=$(echo "$hit" | grep -oE '[0-9]+ ' | head -1 | tr -d ' ')
            if [ "$n" != "$truth" ]; then
                echo "MISMATCH|$label|$truth|$hit"
            fi
        done
    }

    : >"$TMP/count-issues"
    check_count "node types" "$NODE_COUNT" "node types|nœuds|noeuds|nodes disponibles|types de nœuds|node kinds" >>"$TMP/count-issues"
    check_count "MCP tools" "$MCP_TOOLS" "tools|outils" >>"$TMP/count-issues"
    check_count "MCP groups" "$MCP_GROUPS" "groups|groupes" >>"$TMP/count-issues"
    check_count "git providers" "$PROVIDER_COUNT" "git providers|providers git|providers|forges" >>"$TMP/count-issues"
    check_count "containers" "$CONTAINER_COUNT" "containers|conteneurs" >>"$TMP/count-issues"
    check_count "node categories" "$CATEGORY_COUNT" "categories|catégories" >>"$TMP/count-issues"

    # website/apps/web/lib/pipeline.ts duplicates the per-category counts that feed
    # four sections. It is data, not prose, so the scan above never sees it.
    pipeline_ts="$WEB_SRC/lib/pipeline.ts"
    if have "$pipeline_ts"; then
        for cat in $(grep -h "category: '" "$NODES_SRC"/*/node.ts |
            sed "s/.*category: '\([a-z]*\)'.*/\1/" | sort -u); do
            truth=$(grep -h "category: '$cat'" "$NODES_SRC"/*/node.ts | grep -c .)
            claimed=$(perl -0777 -ne "print \$1 if /id: '$cat',.{0,200}?count: (\\d+)/s" "$pipeline_ts")
            [ -n "$claimed" ] || continue
            [ "$claimed" = "$truth" ] ||
                echo "MISMATCH|node category $cat (lib/pipeline.ts)|$truth|$pipeline_ts: count: $claimed" >>"$TMP/count-issues"
        done
    fi

    if [ -s "$TMP/count-issues" ]; then
        while IFS='|' read -r _ label truth hit; do
            fail "$label: code says $truth — $(echo "$hit" | rel)"
        done <"$TMP/count-issues"
    else
        ok "every numeric claim matched (nodes=$NODE_COUNT tools=$MCP_TOOLS groups=$MCP_GROUPS providers=$PROVIDER_COUNT containers=$CONTAINER_COUNT categories=$CATEGORY_COUNT)"
    fi

    for word_pair in "three:3" "four:4" "five:5" "six:6" "trois:3" "quatre:4" "cinq:5" "six:6"; do
        word=${word_pair%%:*}
        value=${word_pair##*:}
        [ "$value" = "$CONTAINER_COUNT" ] && continue
        hits=$(grep -rniE "$word (containers|conteneurs)" $(cat "$TMP/files") 2>/dev/null | rel)
        [ -n "$hits" ] && fail "spelled container count is wrong (code says $CONTAINER_COUNT): $hits"
    done
fi

# --------------------------------------------------------- 3. git providers

if want providers; then
    head2 "providers — pages that enumerate Git providers"

    "$SCRIPTS_DIR/facts.sh" git-providers | grep -m1 '^enum=' | cut -d= -f2 |
        tr ' ' '\n' | grep . | tr 'A-Z_' 'a-z-' >"$TMP/providers"

    provider_drift=0
    for f in $(grep -rl -iE 'gitea' $(cat "$TMP/files") 2>/dev/null); do
        missing=""
        while read -r p; do
            case "$p" in
            github | gitlab | gitea) continue ;;
            esac
            label=$(echo "$p" | sed 's/-/ ?/')
            grep -qiE "$label" "$f" || missing="$missing $p"
        done <"$TMP/providers"
        if [ -n "$missing" ]; then
            fail "$(echo "$f" | rel) lists Gitea but never mentions:$missing"
            provider_drift=1
        fi
    done
    [ "$provider_drift" = 0 ] && ok "no page enumerates a stale subset of the $PROVIDER_COUNT providers"
fi

# ----------------------------------------------------------- 4. encryption

if want encryption; then
    head2 "encryption — algorithm named in prose"
    expected=$(echo "$ALGO" | tr 'a-z' 'A-Z')
    hits=$(grep -rnoiE 'aes-?256-?(cbc|gcm|ctr|ecb)' $(cat "$TMP/files") 2>/dev/null)
    if [ -n "$hits" ]; then
        echo "$hits" | while IFS= read -r hit; do
            got=$(echo "$hit" | grep -oiE 'aes-?256-?(cbc|gcm|ctr|ecb)' | tr 'a-z' 'A-Z' | tr -d '-')
            want_flat=$(echo "$expected" | tr -d '-')
            if [ "$got" != "$want_flat" ]; then
                echo "[FAIL] encryption is $ALGO — $(echo "$hit" | rel)"
            fi
        done | tee "$TMP/enc"
        [ -s "$TMP/enc" ] && FAILED=1
        [ -s "$TMP/enc" ] || ok "every mention of the cipher says $ALGO"
    else
        ok "no cipher named in prose"
    fi
fi

# ----------------------------------------------------------- 5. env variables

if want env-vars; then
    head2 "env-vars — variables documented vs read by the code"

    # Ground truth = variables read by the app, by install.sh, by the CLI, plus
    # every Prisma enum member (docs write those in backticks too).
    {
        "$SCRIPTS_DIR/facts.sh" env-vars | grep '^  ' | tr -d ' '
        have "$INSTALL_SH" && grep -ohE '[A-Z][A-Z0-9_]{3,}' "$INSTALL_SH"
        have "$CLI_ROOT/src" && grep -rhoE 'process\.env\.[A-Z][A-Z0-9_]*' "$CLI_ROOT/src" | sed 's/process\.env\.//'
        grep -h '^  [A-Z][A-Z_0-9]*$' "$PRISMA_MODELS"/*.prisma 2>/dev/null | tr -d ' '
    } | sort -u >"$TMP/env-real"

    if do_docs; then
        grep -ohE '`[A-Z][A-Z0-9_]{3,}`' $(find "$DOCS_SRC" -name '*.mdx') 2>/dev/null |
            tr -d '`' | sort -u >"$TMP/env-doc"
        : >"$TMP/env-ghost"
        while read -r v; do
            grep -qx "$v" "$TMP/env-real" && continue
            grep -qx "$v" "$SCRIPTS_DIR/../references/known-terms.txt" 2>/dev/null && continue
            echo "$v" >>"$TMP/env-ghost"
        done <"$TMP/env-doc"
        if [ -s "$TMP/env-ghost" ]; then
            warn "documented but never read by the code (renamed? removed? or not a variable):"
            sed 's/^/         /' "$TMP/env-ghost"
        else
            ok "every documented variable is read somewhere in the code"
        fi

        if have "$INSTALL_SH"; then
            grep -oE '\--env [A-Z][A-Z0-9_]*' "$INSTALL_SH" | sed 's/--env //' | sort -u >"$TMP/env-install"
            missing=$(comm -23 "$TMP/env-install" "$TMP/env-doc")
            if [ -n "$missing" ]; then
                warn "injected by install.sh but absent from the docs reference:"
                echo "$missing" | sed 's/^/         /'
            else
                ok "every variable install.sh injects is documented"
            fi
        fi
    fi
fi

# ------------------------------------------------------------- 6. doc coverage

if want coverage; then
    head2 "coverage — product surface with no prose"

    if do_docs; then
        : >"$TMP/undocumented"
        while read -r id; do
            grep -rqF "$id" "$DOCS_SRC" || echo "$id" >>"$TMP/undocumented"
        done <"$TMP/node-ids"
        if [ -s "$TMP/undocumented" ]; then
            fail "$(grep -c . "$TMP/undocumented")/$NODE_COUNT pipeline nodes are not mentioned anywhere in the docs:"
            sed 's/^/         /' "$TMP/undocumented"
        else
            ok "all $NODE_COUNT pipeline nodes appear in the docs"
        fi

        : >"$TMP/mcp-undocumented"
        while read -r t; do
            grep -rqF "$t" "$DOCS_SRC" || echo "$t" >>"$TMP/mcp-undocumented"
        done <"$TMP/mcp-tools"
        n=$(grep -c . "$TMP/mcp-undocumented" 2>/dev/null || true)
        [ "$n" -gt 0 ] && warn "$n/$MCP_TOOLS MCP tools are never named in the docs (fine if the page documents groups, not tools)"
        [ "$n" -eq 0 ] && ok "all $MCP_TOOLS MCP tools appear in the docs"

        for section in $("$SCRIPTS_DIR/facts.sh" product | grep '^admin_sections=' | cut -d= -f2); do
            grep -rqi "$section" "$DOCS_SRC" || warn "admin section '$section' has no mention in the docs"
        done
    fi
fi

# --------------------------------------------------------------- 7. i18n parity

if want i18n && do_docs; then
    head2 "i18n — fr (default) vs en parity in the docs"

    missing_en=0
    for f in $(find "$DOCS_SRC" -name '*.mdx' ! -name '*.en.mdx'); do
        en="${f%.mdx}.en.mdx"
        if [ ! -f "$en" ]; then
            fail "no English counterpart: $(echo "$f" | rel)"
            missing_en=1
        fi
    done
    for f in $(find "$DOCS_SRC" -name '*.en.mdx'); do
        fr="${f%.en.mdx}.mdx"
        [ -f "$fr" ] || fail "English page with no French original: $(echo "$f" | rel)"
    done
    # Only meta files carrying a translatable "title" need an English twin.
    for f in $(find "$DOCS_SRC" -name 'meta.json'); do
        grep -q '"title"' "$f" || continue
        [ -f "${f%.json}.en.json" ] || fail "no meta.en.json beside $(echo "$f" | rel)"
    done
    [ "$missing_en" = 0 ] && ok "every French page has an English counterpart"

    for f in $(find "$DOCS_SRC" -name '*.mdx' ! -name '*.en.mdx'); do
        en="${f%.mdx}.en.mdx"
        [ -f "$en" ] || continue
        a=$(grep -c '^#' "$f")
        b=$(grep -c '^#' "$en")
        [ "$a" = "$b" ] || warn "heading count differs ($a fr / $b en) — translation lag: $(echo "$f" | rel)"
        a=$(grep -c '^|' "$f")
        b=$(grep -c '^|' "$en")
        [ "$a" = "$b" ] || warn "table row count differs ($a fr / $b en): $(echo "$f" | rel)"
    done
fi

# ------------------------------------------------------------ 8. internal links

if want links && do_docs; then
    head2 "links — internal doc links that resolve"
    grep -rhoE '\]\(/[a-z0-9/-]*\)' "$DOCS_SRC" 2>/dev/null |
        sed 's/](//; s/)$//' | sort -u >"$TMP/links"
    broken=0
    while read -r l; do
        [ -n "$l" ] || continue
        p="${l#/}"
        # fumadocs serves the default locale unprefixed and /en/... for English
        p="${p#en/}"
        p="${p#fr/}"
        [ -z "$p" ] && continue
        if [ -f "$DOCS_SRC/$p.mdx" ] || [ -f "$DOCS_SRC/$p/index.mdx" ] || [ -d "$DOCS_SRC/$p" ]; then
            continue
        fi
        fail "link to a page that does not exist: $l"
        grep -rl "]($l)" "$DOCS_SRC" | rel | sed 's/^/         /'
        broken=1
    done <"$TMP/links"
    [ "$broken" = 0 ] && ok "every internal doc link resolves"
fi

# ------------------------------------------------------------- 9. meta.json

if want meta && do_docs; then
    head2 "meta.json — sidebar entries vs files on disk"
    for meta in $(find "$DOCS_SRC" -name 'meta.json'); do
        dir=$(dirname "$meta")
        awk '/"pages"/ { inside = 1 } inside { print } inside && /\]/ { exit }' "$meta" |
            grep -oE '"[a-z0-9./-]+"' | tr -d '"' | grep -v '^pages$' | sort -u >"$TMP/meta-pages"
        for page in $(find "$dir" -maxdepth 1 -name '*.mdx' ! -name '*.en.mdx' ! -name 'index.mdx' -exec basename {} .mdx \;); do
            grep -qx "$page" "$TMP/meta-pages" || warn "$page is not listed in $(echo "$meta" | rel)"
        done
        for entry in $(cat "$TMP/meta-pages"); do
            case "$entry" in
            index | separator | "") continue ;;
            esac
            [ -f "$dir/$entry.mdx" ] || [ -d "$dir/$entry" ] ||
                warn "$(echo "$meta" | rel) lists '$entry' but no such page exists"
        done
    done
    ok "meta.json sweep done"
fi

# ------------------------------------------------------------- 10. versions

if want versions; then
    head2 "versions — image tags and runtimes named in prose"
    if have "$INSTALL_SH"; then
        for pair in $(grep -oE '^readonly IMG_[A-Z_]+="[^"]+"' "$INSTALL_SH" | sed 's/^readonly //; s/"//g'); do
            image=${pair##*=}
            name=${image%%:*}
            name=${name##*/}
            tag=${image##*:}
            hits=$(grep -rnoiE "$name:?v?[0-9]+\.[0-9]+[.0-9]*" $(cat "$TMP/files") 2>/dev/null |
                grep -viE "$name:?$tag" | rel)
            [ -n "$hits" ] && fail "$name is pinned to $tag in install.sh but prose says otherwise:
$(echo "$hits" | sed 's/^/         /')"
        done
    fi
    engine=$(node -p "require('$APP_ROOT/package.json').engines?.node ?? ''" 2>/dev/null | tr -d '>=~^ ')
    if [ -n "$engine" ]; then
        major=${engine%%.*}
        hits=$(grep -rnoiE 'node(\.js)? [0-9]+' $(cat "$TMP/files") 2>/dev/null |
            grep -viE "node(\.js)? $major" | rel)
        [ -n "$hits" ] && warn "package.json requires node >=$engine:
$(echo "$hits" | sed 's/^/         /')"
    fi
    ok "version sweep done"
fi

printf '\n'
if [ "$FAILED" = 1 ]; then
    echo "RESULT: drift found — every [FAIL] above is a provable mismatch."
else
    echo "RESULT: no provable mismatch. [WARN] lines still need a human read."
fi
exit "$FAILED"
