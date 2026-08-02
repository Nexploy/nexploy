---
name: add-git-provider
description: Adds a complete new Git provider (Bitbucket, Forgejo, Codeberg, Azure DevOps, a self-hosted forge…) to Nexploy — Prisma enum, adapter + API client, OAuth wiring, webhook route, admin setup form, and i18n. Trigger when the user asks to "add a Git provider", "support Bitbucket/Forgejo/…", "integrate a new forge", or "add X as a Git source".
---

# Add a Git Provider

Nexploy talks to every forge through a single interface, `GitProviderAdapter`. Adding a provider means
implementing that interface plus wiring ~12 registration points. Nothing in the build pipeline,
webhook service, or token refresh logic needs to change — they are already adapter-driven.

Use **Gitea** as the reference implementation: it is the most recent provider, supports self-hosted
`baseUrl`, and exercises every part of the interface.

## Step 0 — Gather information

Determine before writing code:

- **`PROVIDER`** — the enum member, SCREAMING_CASE (e.g. `BITBUCKET`)
- **`provider`** — lowercase slug used in UI props, routes, i18n keys (e.g. `bitbucket`)
- **`Provider`** — PascalCase for file/component names (e.g. `Bitbucket`)
- **Self-hosted?** If the forge can be self-hosted, `baseUrl` is **required** in the setup form
  (like Gitea). If it is SaaS-only, `baseUrl` is optional with a default (like GitLab).
- **OAuth flow** — authorize URL, token endpoint, whether refresh tokens are issued, scopes needed
  (must cover: read user, read/write repos, create webhooks, create releases, write commit statuses).
- **App model** — plain OAuth app (GitLab/Gitea) or an installable App with a private key
  (GitHub). Prefer the plain OAuth app path unless the forge requires otherwise.
- **Webhook** — signature header name and algorithm, push event header/name, payload shape.
- **Clone credential username** — the literal used in `https://<user>:<token>@host/...`
  (`x-access-token` for GitHub, `oauth2` for GitLab/Gitea).

Read `references/adapter-contract.md` for the method-by-method contract, and
`references/registration-points.md` for the exhaustive file checklist with exact snippets.

If the forge's API details are uncertain, fetch current docs with Context7 before implementing —
do not guess endpoint shapes or OAuth parameter names.

## Step 1 — Prisma enum + migration

`apps/nexploy/prisma/models/oauthGit.prisma`:

```prisma
enum GitProviderType {
  GITHUB
  GITLAB
  GITEA
  BITBUCKET
}
```

Then:

```bash
pnpm --filter=nexploy db:migrate:dev
pnpm --filter=nexploy db:generate
```

`GitProviderType` is imported from `generated/client` everywhere — regenerating makes TypeScript
surface most remaining registration points as `Record<GitProviderType, …>` exhaustiveness errors.
**Run `pnpm types` after this step and treat every error as a to-do item.**

## Step 2 — API client

`apps/nexploy/src/services/git/providers/<provider>/<provider>.client.ts`

Mirror `providers/gitea/gitea.client.ts`:

- A `ky<Provider>(baseUrl, explicitToken?)` factory setting the `Authorization` header from
  `getTokenGitStorage().accessToken`, falling back to `explicitToken`.
- Response interfaces (`<Provider>Repo`, `<Provider>Branch`, `<Provider>Commit`, `<Provider>User`).
- A `fetchAllPages` helper honouring the forge's pagination style.
- One exported function per API call: user repos, repository, branches, commits, authenticated user,
  create/delete webhook, exchange code, refresh token, create release, update commit status.

Keep all HTTP details in this file. The adapter must contain **zero** `ky`/`fetch` calls.

## Step 3 — Adapter

`apps/nexploy/src/services/git/providers/<provider>/<provider>.adapter.ts`

Export `const <provider>Adapter: GitProviderAdapter = { … }` implementing every member of
`@/services/git/core/GitProviderAdapter`. Copy `gitea.adapter.ts` as the skeleton and see
`references/adapter-contract.md` for per-method requirements and pitfalls.

Non-negotiables:

- `webhookPath` must equal `/api/webhooks/<provider>` and match the route created in Step 5.
- `parseRepoUrl` delegates to `parseRepositoryUrl` from `@/services/git/core/repoUrl` — it already
  handles `https://`, `ssh://`, and `git@host:owner/repo.git`. Pass `nestedNamespace: true` only for
  forges with subgroups (GitLab). Never hand-roll URL parsing.
- List endpoints must paginate to exhaustion (see the `fetchAllPages` helper in each client).
- `verifyWebhookSignature` must use `timingSafeEqual` from `@/lib/api/crypto-utils`.
- Throw `GIT_OAUTH_EXCHANGE_FAILED` (imported from `github.adapter`) when the token exchange fails,
  so the OAuth callback redirects with `?error=token_exchange_failed`.
- Omit `revokeToken` entirely if the forge has no revocation endpoint — it is optional.

## Step 4 — Register the adapter

`apps/nexploy/src/services/git/core/registry.ts` — add to `gitAdapters`. The `Record<GitProviderType, …>`
type makes this mandatory; once done, the whole app (clone, webhooks, releases, commit statuses,
token refresh, repository listing) works for the new provider.

## Step 5 — Webhook route

`apps/nexploy/src/app/api/webhooks/<provider>/route.ts`

Copy `webhooks/gitea/route.ts` verbatim, changing only the event header name and
`getGitAdapter('<PROVIDER>')`. Do not add provider logic here — parsing and signature verification
belong in the adapter.

## Step 6 — Provider persistence

`apps/nexploy/src/services/git/gitProviders.service.ts` — add
`save<Provider>Provider(displayName, clientId, clientSecret, baseUrl)` following `saveGiteaProvider`
(encrypt `clientId`/`clientSecret`, never the `baseUrl`).

`apps/nexploy/src/services/git/gitAccounts.service.ts` — add the entry to `DEFAULT_BASE_URL`
(`''` for self-hosted-only forges, the SaaS host otherwise).

## Step 7 — Schema + action

- `packages/schemas-zod/src/git/<provider>Setup.schema.ts` — mirror `giteaSetup.schema.ts`.
- `apps/nexploy/src/actions/git/save<Provider>Provider.action.ts` — mirror
  `saveGiteaProvider.action.ts`: `authActionServer` + `requirePermission('gitProvider', 'create')`,
  `revalidatePath('/admin/integrations')`, `setToastServer` on error.
- Widen the `z.enum([...])` provider lists in `packages/schemas-zod/src/git/git.schema.ts` and
  `packages/schemas-zod/src/repository/repositoryCreate.schema.ts`.
- Widen the string unions in `packages/typescript-interface/src/git/git.ts` and
  `packages/typescript-interface/src/repository/build.ts`.

## Step 8 — UI

- `apps/nexploy/src/components/git/providerIcons.tsx` — add the icon to `PROVIDER_ICONS`. Verify the
  icon exists in `@thesvg/react` (`ls node_modules/@thesvg/react`); if not, add an inline SVG component.
- `apps/nexploy/src/components/admin/integrations/<Provider>AppSetupForm.tsx` — copy
  `GiteaAppSetupForm.tsx`.
- `IntegrationsAddButtons.tsx` — widen the `provider` prop union, add the `switch` case and the
  `ADD_LABELS` entry.
- `GitProviderAccordionItem.tsx` — widen the `value` prop union.
- `GitProvidersSection.tsx` — add the `<GitProviderAccordionItem>` and the `defaultValue` array entry.
- `RepositoriesGrid.tsx` — add the icon import and the filter `<SelectItem value="<PROVIDER>">`.

Everything else (`GitAccountFormField`, `IntegrationCard`, `AccountIntegrations`, `GitSourceStep`,
pipeline config panels) is already provider-agnostic — **do not touch it**.

## Step 9 — AI MCP tool

`apps/nexploy/src/lib/ai/mcp/groups/pipeline.group.ts` has an `if/else if` chain on
`repo.gitProvider` for repository file analysis. Add a branch calling a new
`fetch<Provider>Files(...)` helper, or the AI repo-analysis tool returns
`Unsupported git provider` for the new forge.

## Step 10 — i18n (MANDATORY, both locales)

Add to **both** `packages/i18n/locales/en/` and `packages/i18n/locales/fr/`:

| File | Keys |
| --- | --- |
| `integrations.json` | `<provider>.title`, `<provider>.description`, `oauth.add<Provider>`, `oauth.guide.<provider>.{step1,step2,step3,baseUrlLabel,baseUrlPlaceholder,createApp}` |
| `repository.json` | `providers.<provider>` |
| `errors.json` | `oauthProvider.save<Provider>Failed` |
| `common.json` | update the onboarding tour text listing the available providers |

No hardcoded user-facing strings — that rule is enforced project-wide.

## Step 11 — Verify

```bash
pnpm types
pnpm lint
```

Then manually: Admin → Integrations → add the provider → connect the OAuth account from
Account → Integrations → create a repository → confirm the webhook was registered on the forge and
a push triggers a build.

## Rules

- **No comments in the code.** Project-wide rule — use self-explanatory naming instead.
- Any new provider-specific `if (provider === …)` branch outside the adapter is a design smell.
  Add a method or property to `GitProviderAdapter` instead, and implement it for all providers.
- Secrets (`clientId`, `clientSecret`, `privateKey`, tokens) are always stored via `encrypt()` from
  `@/lib/encryption` and read via `decrypt()`.
