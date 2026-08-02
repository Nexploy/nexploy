# `GitProviderAdapter` — method-by-method contract

Source of truth: `apps/nexploy/src/services/git/core/GitProviderAdapter.ts`.
Reference implementation: `apps/nexploy/src/services/git/providers/gitea/gitea.adapter.ts`.

Tokens flow into API clients through `tokenGitStorage` (AsyncLocalStorage). Wrap client calls in
`tokenGitStorage.run(token, () => …)` so `kyProvider`'s `beforeRequest` hook picks up the access
token — except where an explicit token argument is used (`getAuthenticatedUser`, `createRelease`,
`updateCommitStatus`).

## Properties

| Property | Contract |
| --- | --- |
| `type` | The `GitProviderType` enum member. |
| `cloneCredentialUsername` | Username injected into the clone URL by `inngest/pipeline/services/git.service.ts` (`https://<username>:<token>@host/...`). GitHub uses `x-access-token`, GitLab/Gitea use `oauth2`. |
| `webhookPath` | `/api/webhooks/<provider>`. Must match the route file in `app/api/webhooks/`. Used by `repoWebhook.service.ts` to build the webhook URL. |

## `parseRepoUrl(url) → ParsedRepoUrl`

Delegate to the shared helper — all three providers do:

```typescript
import { parseRepositoryUrl } from '@/services/git/core/repoUrl';

parseRepoUrl(url: string): ParsedRepoUrl {
    return parseRepositoryUrl(url, { providerLabel: 'Bitbucket' });
},
```

It normalizes `https://host/owner/repo.git`, `ssh://git@host/owner/repo.git` and
`git@host:owner/repo.git`, derives `baseUrl` as `protocol//host` (so self-hosted instances work),
and throws on fewer than two path segments.

Pass `nestedNamespace: true` for forges with subgroups (GitLab): `owner` becomes the full namespace
path instead of the single segment before the repo.

## `listRepositories({ token, baseUrl })`

Returns every repository the user can push to, **paginated to exhaustion** — each client has a
`fetchAllPages` helper (`PAGE_LIMIT = 100`, `MAX_PAGES = 20`, stop when a page comes back short).
Skipping pagination silently truncates the user's repository picker at the forge's default page size.

Map to `GitRepository`: `{ id: string, name, fullName, url (clone URL), private, defaultBranch }`.
`id` is always stringified — the DB stores `gitId` as a string.

## `getRepository({ token, baseUrl, gitId, repositoryUrl })`

Prefer resolving via `parseRepoUrl(repositoryUrl)`; `gitId` is available for forges whose API is
id-addressed (GitLab). Same `GitRepository` mapping.

## `listBranches({ token, baseUrl, repoId, owner?, repoName? })`

`owner`/`repoName` are optional in the interface because GitLab addresses projects by id. If your
forge is path-addressed, assert them (`owner!`, `repoName!`) like the Gitea adapter. Returns
`{ name, protected }[]`. Paginate to exhaustion, same as `listRepositories`.

## `getCommit({ token, baseUrl, repositoryUrl, branch, commitHash? })`

Returns `{ hash, message }` with `hash` truncated to **8 characters**, or `null`. Must never throw —
wrap the whole body in `try/catch` returning `null`, because the build pipeline calls this
opportunistically for build metadata.

## `getAuthenticatedUser({ token, baseUrl })`

Called during the OAuth exchange, before any account row exists — so it takes the token explicitly
rather than via `tokenGitStorage`. Returns `{ id: string, username: string | null }`; `id` becomes
`GitAccount.providerAccountId`.

## `createWebhook({ token, baseUrl, repo, webhookUrl, secret })`

`repo` is `{ gitId, fullName }` — use whichever the forge's API addresses by. Register **push events
only**, JSON content type, HMAC secret set to `secret`. Returns the webhook id as a string; it is
persisted to `Repository.webhookId` and used for deletion.

## `deleteWebhook({ token, baseUrl, repo, webhookId })`

Must be idempotent — a 404 from the forge is not an error worth propagating.

## `parseWebhookPayload(body) → WebhookPayload | null`

Return `null` for anything that is not a branch push (tags, PR events, ping). On a push, return
`{ repositoryUrl, branch, commitHash, commitMessage }`. `repositoryUrl` must be the clone URL —
`findRepositoryByWebhook` matches it against `Repository.repositoryUrl`. `commitHash` is truncated
to 8 characters. `branch` is the ref with `refs/heads/` stripped.

## `verifyWebhookSignature({ headers, rawBody, secret })`

Compute the HMAC over the **raw body string** (the route reads `request.text()` before
`JSON.parse` precisely for this) and compare with `timingSafeEqual` from `@/lib/api/crypto-utils`.
Return `false` — never throw — when the header is missing.

Known header names: `x-hub-signature-256` (GitHub, `sha256=`-prefixed), `x-gitlab-token` (plain
token comparison, not an HMAC), `x-gitea-signature` (bare hex HMAC-SHA256).

## `buildAuthorizeUrl({ credentials, state, redirectUri })`

Build the forge's authorize URL with `client_id`, `redirect_uri`, `response_type=code`, `state`, and
`scope`. For self-hosted forges the host comes from `credentials.baseUrl`. Define scopes as a
module-level constant (e.g. `const GITEA_OAUTH_SCOPES = '…'`).

## `exchangeCodeForToken({ code, credentials, redirectUri })`

Throw `GIT_OAUTH_EXCHANGE_FAILED` (imported from `github.adapter`) on failure — the callback route
matches on that exact message to redirect with `?error=token_exchange_failed`. Compute
`accessTokenExpiresAt` with `dayjs().add(expires_in, 'second').toDate()`, or `null` for
non-expiring tokens. Finish by calling `this.getAuthenticatedUser(...)` to fill
`providerAccountId` / `providerUsername`.

Returns `OAuthExchangeResult`.

## `refreshToken({ refreshToken, credentials })`

Called by `core/token.service.ts` only when `accessTokenExpiresAt` is in the past. Return a full
`GitProviderToken`; fall back to the incoming `refreshToken` when the forge does not rotate it.
Throw when the provider is not fully configured (missing `baseUrl`/`clientId`/`clientSecret`).

If the forge issues non-expiring tokens, still implement the method (the interface requires it) and
throw a descriptive error — `getValidToken` never calls it when `accessTokenExpiresAt` is `null`.

## `revokeToken?` (optional)

Called by `disconnectGitAccount` on account disconnect, wrapped in a swallowing `try/catch`. The
tokens are decrypted before being handed over — the adapter receives plaintext.

Revoke the refresh token too when the forge issues one (GitLab requires two calls to `/oauth/revoke`,
one per token). Omit the method entirely if the forge has no revocation endpoint: **Gitea has none**
— its OAuth2 provider exposes only `authorize`, `access_token`, `introspect`, `userinfo` and `keys`,
so disconnecting a Gitea account can only delete the local row.

## `createRelease(args) → { releaseId, releaseUrl }`

Powers the `create-release` pipeline node. Takes an explicit `token` (not `tokenGitStorage`).
Honour `draft` and `prerelease`; map `targetBranch` to the forge's target-commitish field.

## `updateCommitStatus(args)`

Powers the `update-commit-status` pipeline node. States are `pending | success | failure | error` —
map them onto the forge's vocabulary (GitLab: `running | success | failed | canceled`).
