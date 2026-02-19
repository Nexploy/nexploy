<p align="center">
  <img src="apps/nexploy/public/logo.svg" alt="Nexploy" width="80" height="80" />
</p>

<h1 align="center">Nexploy</h1>

<p align="center">
  <strong>Self-hosted deployment platform for Docker</strong><br />
  Deploy applications from Git repositories to Docker containers with automatic HTTPS, real-time monitoring, and a modern interface.
</p>

<p align="center">
  Think <strong>Vercel</strong> or <strong>Netlify</strong>, but self-hosted with Docker.
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
- **Desktop App** — Electron app sharing the same UI

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS, shadcn/ui, Zustand |
| **Backend** | Next.js Server Actions, Hono.js, Prisma, PostgreSQL |
| **Auth** | Better Auth (email/password, OAuth, 2FA) |
| **Jobs** | Inngest (resumable background build pipeline) |
| **Infra** | Docker, Traefik, SSE, WebSocket |

## Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **Docker** and **Docker Compose**

### Setup

```bash
git clone https://github.com/yourusername/nexploy.git
cd nexploy
pnpm install

# Configure environment
cp apps/nexploy/.env.example apps/nexploy/.env
cp apps/docker-api/.env.example apps/docker-api/.env

# Start infrastructure (PostgreSQL, Inngest, Traefik)
docker compose -f docker-compose.dev.yml up -d

# Run database migrations
pnpm --filter=nexploy db:migrate:dev

# Start development
pnpm dev
```

| Service | URL |
|---|---|
| Web App | http://localhost:3000 |
| Docker API | http://localhost:3300 |
| Inngest Dev | http://localhost:8288 |
| Traefik Dashboard | http://localhost:8080 |

## Project Structure

```
nexploy/
├── apps/
│   ├── nexploy/             # Next.js app — UI, server actions, orchestration
│   ├── docker-api/          # Hono.js API — Docker operations
│   └── desktop/             # Electron desktop app
├── packages/
│   ├── ui/                  # Shared shadcn/ui components
│   ├── schemas-zod/         # Zod validation schemas
│   ├── typescript-interface/# Shared TypeScript types
│   ├── i18n/                # Internationalization (en, fr)
│   ├── eslint-config/       # Shared ESLint config
│   └── typescript-config/   # Shared TypeScript config
└── infra/
    └── traefik/             # Traefik routing and SSL config
```

## Architecture

### Deployment Flow

```
Git Push → Webhook → Inngest Build Pipeline → Docker API → Container + Traefik Route
```

### Build Pipeline

Powered by Inngest with resumable steps:

1. Clone repository with OAuth token
2. Prepare Dockerfile
3. Write encrypted environment variables
4. Build Docker image (streamed logs)
5. Deploy container with Traefik routing
6. Cleanup and finalize

### Real-time Updates

```
Docker Events → State Manager → SSE → Zustand Store → React UI
```

A single SSE connection multiplexes multiple channels (containers, images, builds, etc.).

## Commands

```bash
# Development
pnpm dev                                # Start all apps
pnpm dev:nexploy                        # Next.js only (port 3000)
pnpm dev:docker-api                     # Docker API only (port 3300)
pnpm dev:desktop                        # Electron app (port 3001)

# Build
pnpm build                              # Build all apps

# Database
pnpm --filter=nexploy db:migrate:dev    # Create & run migrations
pnpm --filter=nexploy db:migrate:prod   # Apply migrations (production)
pnpm --filter=nexploy db:generate       # Generate Prisma client
pnpm --filter=nexploy db:studio         # Open Prisma Studio
pnpm --filter=nexploy db:reset          # Reset database

# Code Quality
pnpm lint                               # Lint all apps
pnpm types                              # Type check
pnpm format                             # Format with Prettier
```

## Environment Variables

Key variables — see `.env.example` for the full list:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nexploy"
ENCRYPTION_KEY="your-32-byte-hex-key"
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"
INNGEST_EVENT_KEY="your-event-key"
INNGEST_SIGNING_KEY="your-signing-key"
```

## Security

- Environment variables encrypted at rest (AES-256-CBC)
- OAuth tokens securely stored with automatic refresh
- Webhook secrets validate Git provider callbacks
- CSRF protection and session-based authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `pnpm lint && pnpm types` before committing
4. Open a Pull Request

## Acknowledgments

[Next.js](https://nextjs.org/) · [shadcn/ui](https://ui.shadcn.com/) · [Prisma](https://www.prisma.io/) · [Better Auth](https://www.better-auth.com/) · [Inngest](https://www.inngest.com/) · [Traefik](https://traefik.io/) · [Hono](https://hono.dev/)
