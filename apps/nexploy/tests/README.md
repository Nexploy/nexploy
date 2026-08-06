# API tests

These tests cover every server action and API route of the `nexploy` app: what they return, and who is allowed to call them.

They run in-process with Vitest against a real PostgreSQL database and a real Better Auth stack, in an isolated environment that never touches the development one.

## Running them

```bash
pnpm --filter=nexploy test          # everything
pnpm --filter=nexploy test:audit    # static guard audit + access-control unit tests (no database needed beyond migrations)
pnpm --filter=nexploy test:api      # runtime tests for actions and routes
pnpm --filter=nexploy test:docker   # integration tests against Docker-in-Docker (implies the real Inngest)
pnpm --filter=nexploy test:inngest  # integration tests against the throwaway Inngest server
pnpm --filter=nexploy test:watch    # watch mode
pnpm --filter=nexploy test:report repositor   # list endpoints and their guards
```

## Isolation

Nothing in this suite can reach the development stack.

| Piece | Development | Tests |
| --- | --- | --- |
| PostgreSQL | 5433 | **5434** (`nexploy_postgres_test`, tmpfs) |
| docker-api | 3300 | **3322** (spawned by the suite) |
| Docker daemon | your host daemon | **`nexploy_dind_test`** on 12375 |
| Inngest | `nexploy_inngest_dev` on 8288 | **8299** (`nexploy_inngest_test`), mocked in the default mode |

`DOCKER_API_URL` in `.env.test` points at 3322, and `tests/setup/vitest.setup.ts` throws on startup if it ever points at the development port. In the default mode `kyDocker` is mocked, so no Docker call leaves the process at all. `@/inngest/client` is mocked too — `inngest.send` records into `inngestEvents` instead of posting anywhere — and the setup throws if `INNGEST_BASE_URL` ever points at the development port 8288.

`tests/runtime/isolation.test.ts` enforces all of this: it wraps `globalThis.fetch`, runs a build action, and fails if any request reaches a development port.

The `nexploy_test` compose stack is brought up before the suite and **torn down with `down -v --remove-orphans` when it finishes**, pass or fail. Set `NEXPLOY_TEST_STACK_KEEP=1` to keep it for debugging, or `NEXPLOY_TEST_DB_AUTOSTART=0` to manage the containers yourself.

## Real Inngest mode

`pnpm --filter=nexploy test:inngest` runs `tests/integration/` with `NEXPLOY_TEST_INNGEST=real`. It starts `nexploy_inngest_test` (`inngest dev --no-discovery`, published on **8299**), waits for it, and uses the real Inngest client. `tests/integration/inngest.test.ts` then checks that an allowed caller's event actually lands on that server, and that a denied caller produces none.

No function is registered on the test server (`--no-discovery`), so events are recorded but nothing executes — which is what makes the mode fast and safe.

## Docker-in-Docker mode

`pnpm --filter=nexploy test:docker` runs `tests/integration/` with `NEXPLOY_TEST_DOCKER=real`. In that mode the suite:

1. starts `postgres`, `dind` **and** `inngest` from `infra/docker/docker-compose.test.yml` (it implies the real Inngest mode),
2. pulls `alpine:latest` into the throwaway daemon,
3. serves a minimal nexploy stub on 3323 (`/api/environments`, `/api/internal/verify-api-key`, the sync-delete endpoints) so `docker-api` can boot without the real app,
4. spawns `docker-api` on 3322 with `NEXPLOY_API_URL` pointing at that stub, its default environment being the DinD daemon over TCP,
5. leaves `kyDocker` unmocked, so the actions issue real HTTP calls that end on the throwaway daemon.

Everything — the docker-api process, the stub, the containers — is stopped and removed at the end. Set `NEXPLOY_TEST_DOCKER_LOGS=1` to see docker-api output.

Configuration lives in `.env.test`.

## Layout

| Path | What it holds |
| --- | --- |
| `setup/` | Vitest setup, Next.js mocks, database reset, fixtures, session helpers, docker-api mock |
| `audit/` | Static inventory of every endpoint, guard audit, permission matrix snapshots |
| `permissions/` | Unit tests of `hasPermission`, `hasOrgPermission`, `canOnOwnedResource` |
| `runtime/` | Per-domain tests that actually call the actions and routes (docker-api mocked) |
| `integration/` | Tests that drive a real `docker-api` against Docker-in-Docker, excluded unless `NEXPLOY_TEST_DOCKER=real` |

Every endpoint of the app is covered. `audit/coverage.test.ts` fails when a guarded endpoint — or an endpoint that leans on an exemption — is never referenced from `tests/runtime`, so a new endpoint cannot land untested. The handful of endpoints that cannot be driven in-process (Better Auth catch-all, Inngest serve, MCP handler, the OAuth redirect pair, the TOTP actions) are listed in that file with a reason.

## The three layers

**1. Guard audit (`audit/`).** `inventory.ts` parses `src/actions/**/*.action.ts` and `src/app/api/**/route.ts`, and extracts the auth middleware, the `requirePermission(resource, action, resolver)` calls, and the action metadata name. `guards.test.ts` then fails when an endpoint has neither a permission guard nor a declared exemption, when an org-scoped resource has no organization resolver, when a resolver sits on a resource that is not org-scoped, or when an exemption loses the evidence it claims.

Every unguarded endpoint must be declared in `audit/exemptions.ts` with a category and a reason. That file is the record of *why* an endpoint is open — adding a new unguarded endpoint fails the suite until it is justified there.

**1 bis. docker-api contract (`audit/dockerApiContract.test.ts`).** Parses every `app.<method>('<path>')` declared by `apps/docker-api` — following the `app.route()` mounts to rebuild the full paths — and every `kyDocker.<method>('<path>')` issued by nexploy. It fails when nexploy calls a path or a verb docker-api does not serve. Paths built by interpolating an enum value (`images/${action}`, `composes/${stack}/${action}`) are declared in `DYNAMIC_CALLS` and every value is checked. The calls that reach nothing are recorded in `KNOWN_CONTRACT_GAPS` with a reason, and the test fails if one of them starts resolving.

**2. Access-control unit tests (`permissions/`).** Pure checks of the role tables, plus the matrix snapshots in `audit/matrix.test.ts` that make any change to a role's reach visible in the diff.

**3. Runtime tests (`runtime/`).** Real calls, real database, real sessions, one verdict per role.

| File | Covers |
| --- | --- |
| `repository.routes.test.ts`, `repository.actions.test.ts`, `repository.remaining.test.ts` | repositories, builds, stages, pipelines, versions, env vars, SSL, domains |
| `docker.actions.test.ts`, `docker.remaining.test.ts` | containers, images, networks, volumes, swarm |
| `admin.test.ts`, `admin.remaining.test.ts` | users, activity, AI, MCP keys, cleanup, upgrade, event streams |
| `infrastructure.test.ts` | environments, registries, git providers, traefik, DNS, cloud backups, host info |
| `organization.test.ts` | organizations, members, invitations |
| `selfService.test.ts` | tasks, git accounts, account rename, sign-in, first-run setup, leaving an organization |
| `unauthenticated.test.ts` | internal service endpoints, git webhook signatures, the AI chat endpoint |

## Adding a domain

Use `describePermissionMatrix`. It reseeds the world before each test, signs in as each fixture user, calls the endpoint, and asserts allow or deny. It also always checks that an anonymous caller is refused.

```ts
import { allowOnly, describePermissionMatrix } from './permissionMatrix';

describePermissionMatrix('registry actions', [
    {
        name: 'createRegistryAction',
        kind: 'action',
        invoke: () => createRegistryAction({ name: 'ghcr', url: 'https://ghcr.io' }),
        expected: allowOnly('admin'),
    },
]);
```

`kind: 'route'` works the same way, with `callRoute(handler, { url, params, searchParams, body })`; the current session cookie is attached automatically.

Permission middlewares run before input validation, so a case only needs an input shaped closely enough to reach the guard. Where the output matters, the suites assert it separately with valid input.

`allow` means the endpoint passed its permission guard — not that the call succeeded. Business failures downstream (no git account linked, docker-api unreachable) still count as allowed, because the guard is what the matrix is about. Assert real outputs in a separate `describe` block, as the repository and admin suites do.

### Fixture users

`seedWorld()` creates two organizations and eight users, each with a real credential account and a real Better Auth session:

| Key | Global role | Organization |
| --- | --- | --- |
| `guest` | guest | none |
| `developer` | developer | none |
| `admin` | admin | none |
| `system` | system | none |
| `orgOwner` | developer | owner of org A |
| `orgAdmin` | developer | admin of org A |
| `orgMember` | developer | member of org A |
| `outsider` | developer | owner of org B |

The four host-level users have no membership on purpose: that keeps global-role expectations separate from organization-role expectations. Org-scoped resources (repository, build, deployment, pipeline, envVar, stage, domain, ssl, container) are decided by the organization role of the owning organization, so `developer` alone is denied on an organization's repository while `orgAdmin` is allowed.

### Mocking docker-api

```ts
mockDocker('get', `container/${id}`, { Config: { Labels: { 'nexploy.organizationId': 'org-org-a' } } });
mockDockerFallback(() => ({}));
```

`dockerCalls` records every call, which is how the docker suite proves a denied caller never reaches the daemon.
