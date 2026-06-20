# E2E tests (Playwright)

Front-end E2E that exercises the **whole app through the browser**, including
everything served by **docker-api** (containers / images / volumes / networks),
end to end: browser → nexploy → docker-api → an isolated Docker daemon.

## Quick start (one command)

```bash
pnpm test:e2e
```

`scripts/e2e.sh` is fully self-contained — it boots an isolated stack, runs the
suite, and tears everything down (pass, fail, or Ctrl-C):

1. **Postgres** (throwaway, `:5434`, tmpfs) — never touches dev data.
2. **Docker-in-Docker** (throwaway, `:12375`) — the daemon docker-api drives, so
   the front-end performs real Docker operations without touching host Docker.
3. Migrates + **seeds** the DB (the seed creates the docker-api API key, which
   the script captures from its output and injects into both services).
4. Repoints the default Docker environment in the DB at the DinD daemon, and
   seeds DinD with sample resources (`e2e-sample-*`).
5. Starts **nexploy** (`:3022`, isolated `.next-e2e` build dir) and **docker-api**
   (`:3300`), wired together with the captured key.
6. Runs Playwright (reuses the running nexploy server).

Nothing touches your dev DB (`5433`), dev server (`3000`), or host Docker.

## Commands

```bash
pnpm test:e2e            # boot stack + run suite + tear down
pnpm test:e2e:ui         # same, Playwright UI mode
pnpm test:e2e:stack:up   # boot the stack and leave it running
pnpm test:e2e:stack:down # tear the stack down
pnpm test:e2e:report     # open the last HTML report
```

First run downloads the browser: `pnpm exec playwright install chromium`.

## Specs

- `auth.setup.ts` — creates the admin via `/setup` (fresh DB → no 2FA) and saves
  the session to `playwright/.auth/user.json`.
- `smoke.spec.ts` — authenticated app shell + key pages render; sign-in form.
- `docker.spec.ts` — each Docker section displays the live `e2e-sample-*`
  resources fetched from docker-api, proving the full front → docker-api → DinD
  chain.
- `container-interactions.spec.ts` — drives every container action from the UI on
  a dedicated `e2e-actions-container`: stop, start, restart, pause, resume, open
  logs / stats, console + attach availability, rename, and delete (force).
- `docker-resources.spec.ts` — create-then-delete a volume and a network, and
  pull-then-delete an image, all through the UI.

## Configuration (env overrides)

| Variable           | Default                                                    |
| ------------------ | --------------------------------------------------------- |
| `E2E_DATABASE_URL` | `postgresql://nexploy:nexploy@localhost:5434/nexploy_test` |
| `E2E_PORT`         | `3022` (nexploy)                                          |
| `DOCKER_API_PORT`  | `3300`                                                    |
| `NEXT_DIST_DIR`    | `.next-e2e`                                               |

## Extending

Container actions and volume / network / image create-delete + image pull are
covered end to end. Good next steps: swarm services, compose stacks, and
repository deploy flows through the UI.
