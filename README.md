<h1 align="center">Nexploy</h1>

<p align="center">
  <strong>Self-hosted alternative to Vercel/Netlify, powered by Docker</strong><br />
  Deploy applications from Git repositories to Docker containers with automatic HTTPS, real-time monitoring, and a modern interface.
</p>

---

## Features

- **Git Integration** — Deploy from GitHub and GitLab with OAuth authentication
- **Automated Build Pipeline** — Resumable, step-by-step builds with real-time log streaming
- **Docker Management** — Containers, images, volumes, and networks from a single dashboard
- **Traefik Reverse Proxy** — Automatic routing and Let's Encrypt SSL certificates
- **Real-time Monitoring** — Live container stats, build logs, and Docker events via SSE
- **Encrypted Environment Variables** — AES-256-CBC encryption at rest
- **In-browser Terminal** — WebSocket-powered Docker container terminal
- **Two-Factor Authentication** — TOTP-based 2FA with backup codes
- **Multi-language** — English and French via `next-intl`

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS, shadcn/ui, Zustand |
| **Backend** | Next.js Server Actions, Hono.js, Prisma 7, PostgreSQL 18 |
| **Auth** | Better Auth (email/password, OAuth, 2FA, API keys) |
| **Jobs** | Inngest (self-hosted, resumable build pipeline) |
| **Infra** | Docker, Traefik v3, SSE, WebSocket |
| **Tooling** | pnpm 11 workspaces + Turborepo |

---

# Development setup

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Node.js** | **22.13+** | pnpm 11 requires it (it loads `node:sqlite`) |
| **pnpm** | 11.9+ | `corepack enable` picks up the version pinned in `package.json` |
| **Docker** | with Compose v2 | Runs Postgres, Inngest and Traefik — and is what Nexploy deploys to |

```bash
corepack enable
node -v   # must be >= 22.13
```

## 1. Install dependencies

```bash
git clone https://github.com/Nexploy/nexploy.git
cd nexploy
pnpm install
```

## 2. Create the env files

```bash
cp apps/nexploy/.env.example    apps/nexploy/.env
cp apps/docker-api/.env.example apps/docker-api/.env
```

Two secrets have no default — generate them and paste them into `apps/nexploy/.env`:

```bash
openssl rand -hex 32   # -> BETTER_AUTH_SECRET
openssl rand -hex 32   # -> ENCRYPTION_KEY
```

Every other value already points at the dev stack (Postgres on `5433`, Inngest on `8288`).
Leave `DOCKER_API_KEY` and `NEXPLOY_API_KEY` empty for now — step 5 produces them.

## 3. Start the infrastructure

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

| Container | Port | Notes |
|---|---|---|
| PostgreSQL | `5433` | user / password / database: `nexploy` |
| Inngest dev server | `8288` | UI to inspect build jobs |
| Traefik | `80`, `443`, `8080` | `8080` is the dashboard |

Wait until Postgres reports `healthy`:

```bash
docker compose -f infra/docker/docker-compose.dev.yml ps
```

## 4. Run the database migrations

```bash
pnpm --filter=nexploy db:migrate:dev
```

## 5. Seed, and wire the internal API key

Nexploy and `docker-api` authenticate to each other with a shared **Better Auth API key**. The seed creates it —
along with the default local Docker environment — and prints it:

```bash
pnpm --filter=nexploy db:seed
```

```
NEXPLOY_API_KEY=nxp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Copy that value into **both** env files. The same key on both sides, or every call between the two services is a `401`:

```env
# apps/nexploy/.env      — the key nexploy sends to docker-api
DOCKER_API_KEY=nxp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# apps/docker-api/.env   — the key docker-api expects, and uses to call nexploy back
NEXPLOY_API_KEY=nxp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Re-running the seed **revokes and recreates** the key. If `docker-api` suddenly answers `401`, copy it again.
> In the Docker deployments this is automated: the app writes the key to a file and `docker-api` fetches it at boot.

## 6. Start the apps

```bash
pnpm dev            # nexploy + docker-api
```

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| Docker API | http://localhost:3300 |
| Inngest dev UI | http://localhost:8288 |
| Traefik dashboard | http://localhost:8080 |

Open http://localhost:3000 — it redirects to `/setup`, where you create the first admin account.

### Running a single app

```bash
pnpm dev:nexploy      # Next.js only (port 3000)
pnpm dev:docker-api   # Docker API only (port 3300)
```

`docker-api` needs access to the Docker socket (`/var/run/docker.sock`). On macOS this works out of the box with
Docker Desktop, OrbStack or Colima — give the VM at least **4 GB of RAM**, the Next.js production build gets
OOM-killed below that.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `docker-api` answers `401` on every route | `NEXPLOY_API_KEY` and `DOCKER_API_KEY` differ, or the seed has been re-run since |
| `EADDRINUSE: :::3300` | A previous `docker-api` is still alive — `lsof -nP -iTCP:3300 -sTCP:LISTEN` |
| Prisma cannot reach the database | The dev stack listens on **5433**, not 5432 |
| `pnpm lint` fails | Known issue: `next lint` was removed in Next 16 and the lint scripts are not migrated yet — use `pnpm types` |

---

## Commands

```bash
# Development
pnpm dev                                # nexploy + docker-api
pnpm dev:nexploy                        # Next.js only (port 3000)
pnpm dev:docker-api                     # Docker API only (port 3300)

# Build & checks
pnpm build                              # Build every workspace (Turborepo)
pnpm types                              # Type check every workspace
pnpm format                             # Format with Prettier

# Database (scoped to the nexploy app)
pnpm --filter=nexploy db:migrate:dev    # Create & apply a migration
pnpm --filter=nexploy db:migrate:prod   # Apply migrations (production)
pnpm --filter=nexploy db:migrate:only   # Create a migration without applying it
pnpm --filter=nexploy db:generate       # Regenerate the Prisma client
pnpm --filter=nexploy db:seed           # Seed + print the internal API key
pnpm --filter=nexploy db:studio         # Prisma Studio
pnpm --filter=nexploy db:reset          # Drop, re-migrate, re-seed

# End-to-end tests
pnpm test:e2e                           # Playwright
```

## Project structure

```
nexploy/
├── apps/
│   ├── nexploy/              # Next.js app — UI, server actions, orchestration
│   │   ├── prisma/           # Schema, migrations, seed
│   │   ├── server.ts         # Custom server (WebSocket proxy to docker-api)
│   │   └── docker/           # Assets used by the production image
│   └── docker-api/           # Hono.js API — every Docker operation
├── packages/
│   ├── ui/                   # Shared shadcn/ui components
│   ├── schemas-zod/          # Zod validation schemas
│   ├── typescript-interface/ # Shared TypeScript types
│   ├── shared/               # Shared utilities
│   ├── i18n/                 # Internationalization (en, fr)
│   ├── eslint-config/        # Shared ESLint config
│   └── typescript-config/    # Shared TypeScript config
└── infra/
    ├── docker/               # Compose files (dev, test, pre-prod)
    └── traefik/              # Traefik static + dynamic configuration
```

Each dependency is declared in the workspace that actually imports it; the root `package.json` only carries the
cross-cutting tooling (Turborepo, TypeScript, Prettier, ESLint, Playwright).

## Architecture

### Deployment flow

```
Git push → Webhook → Inngest build pipeline → docker-api → Container + Traefik route
```

### Build pipeline

Inngest runs the build as resumable steps — a failed build restarts from `Build.lastCompletedStep`, not from zero:

1. Clone the repository with the OAuth token
2. Prepare the Dockerfile
3. Write the decrypted environment variables to `.env`
4. Build the Docker image (logs streamed over SSE)
5. Deploy the container and register its Traefik route
6. Clean up and finalize the logs

### Real-time updates

```
Docker events → State manager → SSE → Zustand store → React UI
```

A single `EventSource` connection multiplexes every channel (containers, images, builds, Traefik requests…).

### Server actions vs API routes

Mutations go through `next-safe-action` server actions; **every read is a Next.js API route**. Client components
call `fetch('/api/...')` instead of a server action.

## Production deployment

On any machine with Docker:

```bash
curl -fsSL https://nexploy.app/install.sh | sh
```

Nothing is cloned and nothing is compiled — the installer pulls the published images
(`nexploy/nexploy` and `nexploy/docker-api`), so a fresh install takes about a minute.

It installs Docker if needed, asks for your domain and a Let's Encrypt email (or lets you skip both and run on
the server's bare IP over plain HTTP), generates every secret into `/etc/nexploy/nexploy.env`, writes the
Traefik configuration, then starts five containers:

| Container | Role |
|---|---|
| `nexploy_traefik` | Reverse proxy, TLS, ports 80/443 |
| `nexploy_app` | The application (runs migrations and the seed on first boot) |
| `nexploy_docker_api` | Docker operations |
| `nexploy_postgres` | Database |
| `nexploy_inngest` | Build pipeline jobs |

Requirements: ports **80** and **443** free and reachable. If you use a domain, DNS must point at the machine
before the install finishes — Let's Encrypt uses an HTTP challenge.

### Installing without a domain (IP only)

```bash
NEXPLOY_NO_DOMAIN=true sh -c "$(curl -fsSL https://nexploy.app/install.sh)"
```

The installer detects the server's public IP and serves Nexploy over plain HTTP — no Let's Encrypt, no email
needed. Switch to a real domain with HTTPS later from **Admin → Settings** in the app, no reinstall required.

### Non-interactive install

```bash
NEXPLOY_DOMAIN=nexploy.example.com NEXPLOY_EMAIL=you@example.com \
  sh -c "$(curl -fsSL https://nexploy.app/install.sh)"
```

| Variable | Default | Purpose |
|---|---|---|
| `NEXPLOY_DOMAIN` | *(prompted)* | Domain the app is served on |
| `NEXPLOY_EMAIL` | *(prompted if a domain is set)* | Let's Encrypt contact address |
| `NEXPLOY_NO_DOMAIN` | `false` | Set to `true` to skip the domain and serve over the server's IP (plain HTTP) |
| `NEXPLOY_VERSION` | *(latest release)* | Image tag to deploy, e.g. `v1.0.0` |
| `NEXPLOY_DIR` | `/etc/nexploy` | Where secrets and Traefik config live |

### Upgrading

```bash
curl -fsSL https://nexploy.app/install.sh | sh -s upgrade
```

The upgrade pulls the requested version and recreates the containers. Your secrets, database and domain are
untouched — re-running the installer never regenerates them.

### Managing the instance

```bash
docker logs -f nexploy_app          # application logs
docker restart nexploy_app          # restart the app
docker ps --filter name=nexploy_    # every Nexploy container
```

## Security

- Environment variables encrypted at rest (AES-256-CBC)
- OAuth tokens stored encrypted and refreshed automatically
- Webhook secrets validate Git provider callbacks
- Service-to-service calls authenticated with a Better Auth API key
- CSRF protection and session-based authentication

## Contributing

1. Fork the repository and create a feature branch
2. Run `pnpm types` before committing
3. Add every new user-facing string to **both** the `en` and `fr` locales in `packages/i18n`
4. Open a Pull Request

## Acknowledgments

[Next.js](https://nextjs.org/) · [shadcn/ui](https://ui.shadcn.com/) · [Prisma](https://www.prisma.io/) · [Better Auth](https://www.better-auth.com/) · [Inngest](https://www.inngest.com/) · [Traefik](https://traefik.io/) · [Hono](https://hono.dev/)
