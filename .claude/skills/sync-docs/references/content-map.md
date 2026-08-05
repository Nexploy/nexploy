# Content map — who asserts what, and where the truth lives

Two prose surfaces, one source of truth (`nexploy/`). This map is what turns
"check the docs" into a finite list of lookups. Paths are relative to each repo root.

Regenerate the moving numbers with `scripts/facts.sh` rather than trusting anything below.

---

## Target 1 — marketing website (`website/`, English only)

Prose lives in TSX arrays at the top of each section file, not in JSX. Edit the array.

| File | Asserts | Source of truth |
|---|---|---|
| `apps/web/components/sections/hero.tsx` | one command · N containers · ~1 min; build→container→route→certificate loop | `install.sh`, `inngest/functions/build.ts` |
| `apps/web/components/sections/why.tsx` | no per-seat/build-minute billing; no proprietary format; full Docker surface visible | product-wide, low drift |
| `apps/web/components/sections/how-it-works.tsx` | **provider list + auth mode**, webhook auto-registration, AES claim, per-stage pipeline | `prisma/models/oauthGit.prisma`, `services/git/providers/*`, `lib/encryption.ts` |
| `apps/web/components/sections/stages.tsx` | stage = pipeline + env + Docker host + domain + versions; host connection types | `prisma/models/deploymentStage.prisma`, `environment.prisma` (`DockerConnectionType`) |
| `apps/web/components/sections/pipeline.tsx` | **node total, category count, per-category samples**, 2 templates, graph snapshotting | `nodes/manifests/*`, `pipelineTemplates.ts` |
| `apps/web/lib/pipeline.ts` | **per-category counts + sample node ids** (feeds pipeline.tsx, proof.tsx, comparison.tsx) | `facts.sh nodes` |
| `apps/web/components/sections/fleet.tsx` | containers/images/volumes/networks, Swarm, Compose, domains+SSL+Cloudflare, backups→S3, registries, cleanup | `apps/docker-api/src/routes/*`, `prisma/models/{backupSchedule,bucketStorage,dockerRegistry,cleanupSettings,cloudflare}.prisma` |
| `apps/web/components/sections/live.tsx` | SSE channels, one EventSource, browser shell over WebSocket | `stores/**`, `server.ts` WS proxy, `terminalRoutes.ts` |
| `apps/web/components/sections/assistant.tsx` | **AI provider chips, tool-group table, tool total**, BYO key, confirmation gate | `prisma/models/aiConfig.prisma`, `lib/ai/mcp/**` |
| `apps/web/components/sections/security.tsx` | **cipher**, token refresh, sign-in modes, 2FA, API keys, two role systems, recovery CLI | `lib/encryption.ts`, `lib/auth/*`, `cli/` repo |
| `apps/web/components/sections/comparison.tsx` | feature matrix vs Vercel/Netlify — **node count appears here too** | same as the rows it claims |
| `apps/web/components/sections/pricing.tsx` + `lib/plans.ts` | self-hosted €0, managed tiers | **aspirational** — see writing-guide.md |
| `apps/web/components/sections/faq.tsx` | requirements, install shape, **provider list**, differentiators, upgrade path | `install.sh`, providers, `facts.sh` |
| `apps/web/components/sections/proof.tsx` | **4 headline stats** (nodes, providers, containers, €0) | `facts.sh` |
| `apps/web/components/sections/final-cta.tsx` | install requirements, what the installer does, upgrade command | `install.sh` |
| `apps/web/components/common/instance-panel.tsx` | animated demo: build log lines, pipeline mini-graph, terminal, Traefik requests | plausibility only — it is a mock |
| `apps/web/lib/site.ts` | nav, footer, **stack marquee**, install/upgrade commands, docs URL | `install.sh`, provider list, `infra/docker/*` |
| `apps/web/app/layout.tsx` | **SEO title/description/OG + JSON-LD** — repeats the provider list and node count | keep in lockstep with the sections |
| `apps/web/app/privacy/page.tsx` | subprocessor table — **names the Git providers** | provider list, `lib/email/*` |
| `apps/web/app/{terms,legal,sales-terms}/page.tsx` | legal text with `[TO COMPLETE]` placeholders | **never invent** — see writing-guide.md |
| `apps/web/public/install.sh` | the installer itself — source of truth for install claims | it *is* the truth; read, don't rewrite from prose |

## Target 2 — documentation (`docs/`, fumadocs, fr default + one `.<lang>.mdx` per locale)

`content/docs/<section>/<page>.mdx` (French) and every `<page>.<lang>.mdx` must stay in lockstep.
Sidebar order lives in `meta.json` and one `meta.<lang>.json` per locale, per folder. The locale set
is declared in `docs/lib/i18n.ts`.

| Page | Asserts | Source of truth |
|---|---|---|
| `index` | product pitch, feature tour, **cipher**, **provider list** | broad — re-read on any large change |
| `getting-started/prerequisites` | OS, Docker, ports, RAM/disk, Node version | `install.sh`, root `package.json` engines |
| `getting-started/installation` | install flow, containers created, dev setup | `install.sh`, `infra/docker/docker-compose.dev.yml` |
| `getting-started/configuration` | first-run config, provider setup, **cipher** | admin screens, provider setup schemas |
| `core-concepts/repositories` | repo model, org scoping, branch/domain | `prisma/models/repository.prisma`, `organization.prisma` |
| `core-concepts/environments` | Docker hosts, connection types, TLS | `prisma/models/environment.prisma` |
| `core-concepts/build-pipeline` | build lifecycle, statuses, resumability, logs | `inngest/functions/build.ts`, `BuildStatus` enum |
| `core-concepts/versions` | version save/rollback | `prisma/models/version.prisma`, `save-version` node |
| `core-concepts/organizations` | org roles, membership, invitations | `lib/auth/orgPermissions.ts`, `auth.ts` |
| `pipelines/visual-editor` | canvas, templates, validation, snapshotting | `components/pipeline/**` |
| `pipelines/node-types` | **every node: id, config keys, inputs/outputs** — highest-drift page | `manifests/*`, `nodeConfigs.schema.ts` (`facts.sh node-config`) |
| `docker/{containers,images,volumes-networks,swarm,events}` | per-resource capabilities | `apps/docker-api/src/routes/*`, `managers/*` |
| `networking/{traefik-ssl,domains,requests,cloudflare}` | routing, ACME, custom certs, request log, DNS | `lib/traefik/*`, `sslCertificate.prisma`, `cloudflare.prisma` |
| `features/git-integration` | **provider table, scopes, permissions, webhooks** | `services/git/providers/*`, `schemas-zod/src/git/*` |
| `features/monitoring` | live stats, logs, events, terminal | `stores/**`, `terminalRoutes.ts` |
| `features/registries` | registry CRUD, credentials | `prisma/models/dockerRegistry.prisma`, `registry.service.ts` |
| `features/backups` | schedules, frequencies, S3 targets | `backupSchedule.prisma` (`Frequency`), `bucketStorage.prisma` |
| `features/cleanup` | scheduled prune targets and hour | `cleanupSettings.prisma` |
| `features/ai-assistant` | providers, BYO key, model list, confirmations | `aiConfig.prisma`, `api/ai/models/[provider]/route.ts` |
| `features/tasks` | **task kinds, steps, cancellable set**, retention, SSE channel | `docker-api/src/managers/tasksManager.ts`, `lib/taskRunner.ts`, `typescript-interface/src/task.ts` |
| `features/mcp-server` | **tool count, group table, tool names** | `lib/ai/mcp/**` (`facts.sh mcp`) |
| `security/authentication` | sign-in modes, 2FA, sessions, **cipher**, roles | `lib/auth/*`, `lib/encryption.ts` |
| `security/api-keys` | API key issuance, header, scoping | `auth.ts` apiKey plugin |
| `security/activity-log` | audited sources, entry fields, **redaction rules**, retention + purge cron, permissions | `lib/activity/*`, `services/activityLog.service.ts`, `activityLog.prisma`, `inngest/functions/activityLogPurge.ts` |
| `security/recovery-cli` | commands, recovery key, audit log | `cli/` repo (`facts.sh cli`) |
| `reference/architecture` | services, ports, data flow | `infra/docker/*`, `server.ts`, docker-api routes |
| `reference/environment-variables` | **every env var in both apps** | `facts.sh env-vars` |
| `reference/cli-commands` | pnpm scripts | root + app `package.json` scripts |

## Cross-repo gotchas

- `install.sh` is served by the **website** repo but describes the **app** runtime. A change to
  `infra/docker/*` usually needs an `install.sh` change *and* prose updates in both targets.
- The recovery CLI lives in its own repo (`cli/`); its version and command list are asserted in
  `docs/security/recovery-cli` and `website/security.tsx`.
- The docs URL on the website (`lib/site.ts` → `docsUrl`) and the docs' own internal links must
  agree on slugs. `drift.sh links` covers the docs side only.
