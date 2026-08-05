# API tests

These tests cover every server action and API route of the `nexploy` app: what they return, and who is allowed to call them.

They run in-process with Vitest against a real PostgreSQL database and a real Better Auth stack. Only `docker-api` is mocked.

## Running them

```bash
pnpm --filter=nexploy test          # everything
pnpm --filter=nexploy test:audit    # static guard audit + access-control unit tests (no database needed beyond migrations)
pnpm --filter=nexploy test:api      # runtime tests for actions and routes
pnpm --filter=nexploy test:watch    # watch mode
pnpm --filter=nexploy test:report repositor   # list endpoints and their guards
```

The test database is started automatically from `infra/docker/docker-compose.test.yml` (PostgreSQL on port 5434) and migrated before the suite runs. Set `NEXPLOY_TEST_DB_AUTOSTART=0` if you manage the container yourself. Configuration lives in `.env.test`.

## Layout

| Path | What it holds |
| --- | --- |
| `setup/` | Vitest setup, Next.js mocks, database reset, fixtures, session helpers, docker-api mock |
| `audit/` | Static inventory of every endpoint, guard audit, permission matrix snapshots |
| `permissions/` | Unit tests of `hasPermission`, `hasOrgPermission`, `canOnOwnedResource` |
| `runtime/` | Per-domain tests that actually call the actions and routes |

## The three layers

**1. Guard audit (`audit/`).** `inventory.ts` parses `src/actions/**/*.action.ts` and `src/app/api/**/route.ts`, and extracts the auth middleware, the `requirePermission(resource, action, resolver)` calls, and the action metadata name. `guards.test.ts` then fails when an endpoint has neither a permission guard nor a declared exemption, when an org-scoped resource has no organization resolver, when a resolver sits on a resource that is not org-scoped, or when an exemption loses the evidence it claims.

Every unguarded endpoint must be declared in `audit/exemptions.ts` with a category and a reason. That file is the record of *why* an endpoint is open — adding a new unguarded endpoint fails the suite until it is justified there.

**2. Access-control unit tests (`permissions/`).** Pure checks of the role tables, plus the matrix snapshots in `audit/matrix.test.ts` that make any change to a role's reach visible in the diff.

**3. Runtime tests (`runtime/`).** Real calls, real database, real sessions, one verdict per role.

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
