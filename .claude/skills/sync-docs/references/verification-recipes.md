# Verification recipes

`drift.sh` proves what a regex can prove. Everything below is what it *cannot* —
claims whose truth needs a lookup and a judgement. Each recipe is: the claim shape,
the command that settles it, and the trap that makes people get it wrong.

Run every command from the app repo root unless stated otherwise.

---

## Capability claims ("Nexploy can X")

The failure mode is not a wrong number — it is a feature that was renamed, gated, or never shipped.

**Recipe.** Find the code path that would have to exist, not the word.

```bash
# claim: "scale replicas from the screen that deployed them"
ls apps/nexploy/src/app/\[locale\]/\(app\)/swarm/
grep -rn "scaleService\|updateService" apps/nexploy/src/actions apps/docker-api/src/routes/swarm
```

A UI page **plus** an action/route is proof. A type, an i18n key, or a store field alone is not —
those survive feature removal for months.

**Trap.** A capability can exist in `docker-api` but have no UI. The website says "in the same
interface"; that is a UI claim. Check `app/[locale]/(app)/**/page.tsx` for the screen.

---

## Auth and identity claims

The single most drift-prone family, because intent lives in config that is easy to misread.

```bash
grep -n "socialProviders\|emailAndPassword\|disableSignUp" apps/nexploy/src/lib/auth/auth.ts
grep -rn "signIn\." apps/nexploy/src/components/auth/SignInForm.tsx
```

**Trap.** `accountLinking.trustedProviders: ['github','gitlab']` is *not* social sign-in. Without a
`socialProviders` block and a button in `SignInForm.tsx`, OAuth login does not exist — the Git OAuth
is repository access only. Prove sign-in modes from the form, never from the auth config alone.

---

## Encryption and secret handling

```bash
grep -n "ALGORITHM\|scryptSync\|randomBytes" apps/nexploy/src/lib/encryption.ts
grep -rln "encrypt(" apps/nexploy/src/services/
```

State the algorithm exactly as the constant reads. If prose claims a credential class is encrypted
(registries, S3, Cloudflare, AI keys, Git tokens), confirm the *service* for that model calls
`encrypt()` — the Prisma field being a `String` proves nothing.

---

## Counts that live in two places

`website/apps/web/lib/pipeline.ts` duplicates the per-category node counts. Changing a manifest
without changing that file silently breaks `nodeCount`, which feeds the hero stat, the comparison
table, the FAQ and the OG description.

```bash
scripts/facts.sh nodes | sed -n '/categories_by_count/,/^registered/p'
grep -A3 "id: '" ../website/apps/web/lib/pipeline.ts | grep count
```

Update `lib/pipeline.ts` first, then re-read every page that renders `nodeCount`.

---

## Node catalogue (`docs/pipelines/node-types.mdx`)

Config keys drift silently: a schema gains a field, the doc's bullet list does not.

```bash
scripts/facts.sh node-config | grep '^deploy-compose'
```

Compare against the page's `**Configuration**` bullets for that node. Document every top-level key;
skip keys that never surface in the config panel (check the panel component named in the manifest).

**Trap.** `refable(...)` keys accept a reference to an upstream node output — that is worth saying
once in the page intro, not per key.

---

## Installer claims

`install.sh` is in the **website** repo. Prose about install must be read against the script, and
the script against the compose files.

```bash
grep -n "docker run --detach" -A3 ../website/apps/web/public/install.sh | grep -- --name
scripts/facts.sh install
```

**Trap.** `infra/docker/docker-compose.prod.yml` is *not* what users get — the installer runs plain
`docker run`. Never describe install behaviour from the compose file.

---

## Provider claims

```bash
scripts/facts.sh git-providers
```

`setupFields` tells you what the admin actually types per provider (a GitHub App manifest flow vs
clientId/clientSecret vs a tenant id). `baseUrl=required` means self-hosted instances are supported —
say so, it is a real differentiator that the prose has historically omitted.

---

## "Real-time" / SSE claims

```bash
grep -rn "multiplexed" apps/nexploy/src/app/api/events/ apps/nexploy/src/lib
scripts/facts.sh product | grep sse_channels
```

Channel names in prose should match the ones the stores subscribe to.

---

## Version and dependency claims

```bash
scripts/facts.sh install | grep -E "traefik|IMG_|node_engine"
node -p "require('./apps/nexploy/package.json').dependencies.next"
```

**Trap.** dev and prod compose pin different Traefik versions. The user-facing number is the one in
`install.sh` (`IMG_TRAEFIK`), because that is what gets installed.

---

## Claims about things outside this repo

The recovery CLI (`cli/`), the docs site itself, and the marketing copy about managed hosting are
not in the app repo.

```bash
scripts/facts.sh cli
```

If a claim cannot be traced to any repo you can read, it is either aspirational (must be marked
"coming soon") or unverifiable (must be softened or removed). Never leave an unverifiable claim
stated as present-tense fact.

---

## When code and prose disagree

Order of authority:

1. Running code in the app repo — enums, schemas, routes, components.
2. `install.sh` — for anything a user experiences at install time.
3. Migrations — for what already exists in deployed databases.
4. `README.md` / `CLAUDE.md` — **not authoritative**. Both have been wrong before
   (`CLAUDE.md` still says AES-256-CBC and lists a `DEPLOYING` build status that no enum defines).
   When you find them wrong, say so in the report; fix them only if asked.
