---
name: add-locale
description: Adds a complete new language (locale) across all three Nexploy repos — the app (packages/i18n + next-intl), the @nexploy/nodes pipeline library, and the fumadocs documentation site. Trigger when the user asks to "add a language", "ajouter une langue", "support Spanish/German/…", "traduire l'app en X", or "add a new locale".
---

# Add a new locale

Nexploy has **three independent translation systems** in three sibling repositories. A language is only really "added" when all three are done — otherwise the app switches to the new language while pipeline nodes and the docs stay English/French.

```
Monorepo-Mixte/nexploy/
├── nexploy/   → next-intl, 15 namespaces in packages/i18n/locales/<code>/     (Part A)
├── nodes/     → 63 per-node JSON files + a generated registry/messages.ts     (Part B)
└── docs/      → fumadocs i18n, 34 MDX pages ×2 + UI strings                   (Part C)
```

Scripts in `scripts/` next to this file automate the mechanical parts. They resolve the sibling repos from the app repo's location and skip cleanly if one is missing.

Work the parts in order — Part B changes a published package that Part A consumes, so the propagation step at the end matters.

---

## Step 0 — Gather information

- **Locale code**: ISO 639-1, lowercase (`es`, `de`, `it`). A region suffix (`pt-br`) only if the user explicitly asks for a regional variant. The code must be the same string in all three repos.
- **Native label**: how the language names itself — `Español`, `Deutsch`. Matches existing style: app uses `"English (US)"` / `"Français"`, docs `displayName` uses `English` / `Français`.
- **Scope**: confirm all three repos are wanted. If the user only wants one, do that part and say which ones were left.

Check the sibling repos exist before promising the full job:

```bash
ls -d ../nodes ../docs
```

State the assumptions and get going — do not block on confirmation for an inferrable code.

---

## Translation rules (apply to all three repos)

1. **Never translate keys** — only string values.
2. **Preserve every `{placeholder}`** exactly. All three systems interpolate on `/\{(\w+)\}/`; a renamed placeholder renders as literal braces.
3. **Never drop a key.** The app falls back to English silently (`createTranslator` in `packages/i18n/index.ts`), so a gap is invisible in testing and visible to users.
4. **Do not translate** product and technical nouns: Nexploy, Docker, Traefik, Swarm, Inngest, GitHub, GitLab, Dockerfile, Compose, registry/image/volume/network when used as Docker API terms, HTTP verbs, env-var names, CLI flags, node `type` identifiers.
5. **Keep UI strings short** — buttons and sidebars are fixed-width; German/Russian run ~30% longer than English.
6. **Match the French tone** — it is the existing reference for product voice (vouvoiement, no slang).
7. JSON in the app and nodes repos is **2-space indent**; `.ts`/`.tsx` is 4-space (`biome.json`).

### Writing the files

The app's `it/`, `es/`… directories are created by copying `en/`. Do **not** `cp -r` then edit: the Write tool refuses to overwrite a file it has not read, which costs a Read per file. Instead create the target directory empty and write each namespace fresh:

```bash
rm -rf packages/i18n/locales/<code> && mkdir -p packages/i18n/locales/<code>
```

Then Read `en/<namespace>.json` and Write `<code>/<namespace>.json` in one pass per file.

---

# Part A — `nexploy` app (next-intl)

```
packages/i18n/
├── index.ts                    ← imports + `locales`, `appLocales`, `defaultLocale`
└── locales/{en,fr,<new>}/      ← 15 namespace files each

apps/nexploy/src/
├── i18n/routing.ts                        ← Object.keys(locales) — NO change
├── i18n/request.ts                        ← merges node messages — NO change
├── components/sidebar/ChangeLanguage.tsx  ← Object.keys(locales) — NO change
└── lib/i18n/clientTranslations.ts         ← hardcoded codes — MUST change
```

Namespaces: `account`, `admin`, `ai`, `auth`, `common`, `docker`, `errors`, `integrations`, `monitoring`, `navigation`, `notifications`, `organization`, `repository`, `requests`, `swarm`.

### A1 — Translate the namespaces

~2600 keys / 3000 lines. `docker.json` (921 lines) and `repository.json` (466) are the bulk — translate one file per Write call, largest last, never a blind batch rewrite.

### A2 — Language labels in **every** locale

`ChangeLanguage.tsx` calls `t('account.language.<code>')` for every registered code, so each locale's `account.json` needs an entry for the new language, and the new locale needs entries for all existing ones:

```json
"language": {
  "title": "Language",
  "selectLanguage": "Select a language",
  "en": "English (US)",
  "fr": "Français",
  "<code>": "<native label>"
}
```

The label is the language's own name in every file — `Español` reads the same in the English, French and Spanish menus.

Editing the existing `en`/`fr` files is the one place where a scripted edit is safer than Edit calls, which have been observed to get reverted mid-session:

```bash
for L in en fr; do python3 - "$L" <<'EOF'
import json, sys, collections
loc = sys.argv[1]
p = f'packages/i18n/locales/{loc}/account.json'
d = json.load(open(p), object_pairs_hook=collections.OrderedDict)
d['language']['<code>'] = '<native label>'
open(p, 'w').write(json.dumps(d, indent=2, ensure_ascii=False) + '\n')
EOF
done
```

Verify afterwards — do not assume the write stuck.

### A3 — Register in `packages/i18n/index.ts`

Mirror the `fr` block exactly: 15 imports prefixed with the code (`pt-br` → `ptBr`), a new key in `locales` with all 15 namespaces in the same order, and the code appended to `appLocales`. Leave `defaultLocale = 'en'` unless asked.

This registration is what activates the language — `routing.ts` and `ChangeLanguage.tsx` both derive from `Object.keys(locales)`.

### A4 — `apps/nexploy/src/lib/i18n/clientTranslations.ts`

The only file with hardcoded codes. Powers non-React Docker toasts via the `NEXT_LOCALE` cookie, `docker` namespace only.

```typescript
import esDocker from '@workspace/i18n/locales/es/docker.json';

type Locale = 'en' | 'fr' | 'es';

const translations: Record<Locale, typeof enDocker> = { en: enDocker, fr: frDocker, es: esDocker };

export function getLocale(): Locale {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([\w-]+)/);
    const value = match?.[1];
    if (value === 'fr' || value === 'es') return value;
    return 'en';
}
```

The current `getLocale` only tests `=== 'fr'` — replace it with a set-membership test rather than chaining `if`s, and widen the regex to `([\w-]+)` for hyphenated codes.

---

# Part B — `@nexploy/nodes` (pipeline nodes)

Repo: `../nodes`. 62 node directories plus a shared `registry` one, each with `locales/en.json` and `locales/fr.json`. `src/nodes/registry/messages.ts` imports all 63 files per locale and merges them into `builtinNodeMessages`, consumed by `apps/nexploy/src/i18n/request.ts`.

A locale missing here falls back to `defaultLocale`, so pipeline node names, descriptions and config labels would stay English.

### B1 — Scaffold

```bash
node .claude/skills/add-locale/scripts/scaffold-node-locales.mjs <code>
```

This copies every `en.json` → `<code>.json` and **regenerates the import header and `builtinNodeMessages` block of `messages.ts` from disk**, preserving the `MessageTree` type and `mergeMessages` function verbatim. It is idempotent — existing files are never overwritten. Verified lossless: regenerating with a new locale produces a diff of pure insertions.

### B2 — Translate

The 63 new files are still English. They are small (10–60 lines each); `registry/locales/<code>.json` is the largest — it holds all shared config-panel labels. Each node file looks like:

```json
{
  "nodes": { "build-docker-image": { "name": "…", "description": "…" } },
  "config": { "dockerfileFilePath": "…", "dockerfileFilePathPlaceholder": "…" }
}
```

Translate `name`, `description`, and `config` values. **Never** translate the node type key (`build-docker-image`) or the config keys.

### B3 — Verify and build

```bash
cd ../nodes && pnpm format && pnpm typecheck && pnpm build
```

---

# Part C — `docs` (fumadocs)

Repo: `../docs`. Fumadocs i18n, **default language `fr`** (unlike the app, whose default is `en`).

```
lib/i18n.ts               ← defineI18n: languages, defaultLanguage 'fr', fallbackLanguage 'fr'
lib/layout.shared.tsx     ← per-language displayName + ~45 fumadocs UI strings
app/api/search/route.ts   ← Orama localeMap (stemmer per language)
content/docs/**           ← page.mdx = French, page.en.mdx = English → add page.<code>.mdx
```

### C1 — Scaffold

```bash
node .claude/skills/add-locale/scripts/scaffold-docs-locale.mjs <code>
```

Copies every default-language page and section `meta.json` to `*.<code>.mdx` / `meta.<code>.json`, then prints them sorted by size as a translation worklist. `content/docs/meta.json` (root) has no per-locale variant in the existing setup — leave it alone.

### C2 — Translate the MDX

34 pages, source is **French**. In each file:

- Translate the frontmatter `title` and `description` — fumadocs uses them for the sidebar and search.
- Translate prose and `<Callout>` / `<Card>` text.
- **Never translate**: code fences, shell commands, env-var names, file paths, YAML/JSON samples, MDX component names and prop names, and heading anchors that other pages link to (`#some-anchor`) — if a heading text changes, its slug changes, so check for cross-page links before renaming headings.
- `meta.<code>.json` holds sidebar section labels — translate `title`/`pages` labels, never the page slugs.

### C3 — `lib/i18n.ts`

```typescript
export const i18n = defineI18n({
  defaultLanguage: 'fr',
  languages: ['fr', 'en', '<code>'],
  fallbackLanguage: 'fr',
  hideLocale: 'default-locale',
});
```

Do not change `defaultLanguage` — `hideLocale: 'default-locale'` means French is served at `/` and any change would break every existing URL.

### C4 — `lib/layout.shared.tsx`

Add a block for the new language next to `en` and `fr`, with `displayName` plus **every** fumadocs UI string present in the other blocks (~45 keys: search, sidebar, theme switcher, pagination, 404, page actions, type table). The keys are fumadocs' English source strings with a `(context)` suffix — copy them verbatim from the `en` block and translate only the values. Keep `{url}` in `'Read {url}, I want to ask questions about it.(page actions)'`.

`baseOptions()` builds the nav URL as `lang === 'fr' ? '/' : '/${lang}'` — already generic, no change needed.

### C5 — `app/api/search/route.ts`

```typescript
export const { GET } = createFromSource(source, {
    localeMap: {
        fr: { language: 'french' },
        en: { language: 'english' },
        es: { language: 'spanish' },
    },
});
```

Only add the entry if Orama ships a stemmer for the language (english, french, spanish, german, italian, portuguese, dutch, russian, swedish, norwegian, danish, finnish, and a few more). If it doesn't, omit the entry — search still works, just unstemmed. Do not invent a stemmer name; an unknown one throws at request time.

### C6 — Build

```bash
cd ../docs && pnpm typecheck && pnpm build
```

---

# Propagation — getting the new node translations into the app

Part B changes a package the app consumes as a **published version** (`"@nexploy/nodes"` in `apps/nexploy/package.json`, pinned in `pnpm-workspace.yaml`). Node translations do not reach the app until a new version ships.

To test locally before publishing:

```bash
node scripts/nodes-source.mjs local   # builds ../nodes, packs it, points the app at the tarball
# … verify in the app …
node scripts/nodes-source.mjs npm     # restores the published version
```

To ship: bump `version` in `../nodes/package.json`, publish, then update the version in **both** `apps/nexploy/package.json` and `pnpm-workspace.yaml`, and `pnpm install`. Tell the user this step is required and whether you did it.

---

# Verify everything

```bash
node .claude/skills/add-locale/scripts/check-locale-parity.mjs <code>            # all three repos
node .claude/skills/add-locale/scripts/check-locale-parity.mjs <code> --repo=docs # one repo
```

The script reports, per repo: missing/extra files and keys, placeholder mismatches, missing `language.<code>` labels, missing registrations in `index.ts` / `clientTranslations.ts` / `messages.ts` / `i18n.ts` / `layout.shared.tsx`, missing localized MDX pages and frontmatter. Values identical to English are listed separately as informational — fine for product nouns (`Docker`, `Email`, `OK`); `fr` currently has 271 of them in the app and 87 in the nodes repo. A brand-new scaffolded locale shows *every* value as identical — that is the signal it is still untranslated.

Then:

```bash
pnpm --filter=@workspace/i18n typecheck && pnpm check:fix && pnpm --filter=nexploy build
cd ../nodes && pnpm typecheck && pnpm build
cd ../docs && pnpm typecheck && pnpm build
```

Finally in the browser: `pnpm dev`, switch language via the sidebar avatar menu → Language, and walk the Docker pages, a repository's pipeline editor (node names come from Part B), and the docs language switcher.

---

## Known gaps to report

- **`docker-api`** returns some user-facing strings. Per `AGENTS.md` they should route through `@workspace/i18n`; any still hardcoded stay English.
- **Date/number formatting** — `apps/nexploy/src/components/admin/backups/ScheduleTab.tsx` and `apps/nexploy/src/utils/formatBytes.ts` use `Intl`/`toLocaleDateString`. Check whether they receive the active locale; flag it rather than silently refactoring.
- **Node translations need a package release** (see Propagation) — say so explicitly if you did not publish.

---

## Checklist

**App**
- [ ] 15 JSON files in `packages/i18n/locales/<code>/`, keys identical to `en`
- [ ] `account.json` → `language.<code>` in **every** locale, including the new one
- [ ] `packages/i18n/index.ts`: imports + `locales` entry + `appLocales`
- [ ] `clientTranslations.ts`: import, `Locale` type, `translations` map, `getLocale`

**Nodes**
- [ ] 63 `<code>.json` files scaffolded **and translated**
- [ ] `registry/messages.ts` regenerated, typecheck + build pass

**Docs**
- [ ] 34 `*.<code>.mdx` + 8 `meta.<code>.json` translated
- [ ] `lib/i18n.ts` languages, `lib/layout.shared.tsx` block, search `localeMap` (if a stemmer exists)

**All**
- [ ] `check-locale-parity.mjs <code>` clean across all three repos
- [ ] Builds pass; language switcher verified in the app and in the docs
- [ ] Node package version bump reported or done
