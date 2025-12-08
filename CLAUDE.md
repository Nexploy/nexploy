# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexploy is a self-hosted Docker deployment platform that deploys applications from Git repositories (GitHub/GitLab) to Docker containers with Traefik as a reverse proxy. Think Vercel/Netlify but self-hosted with Docker.

## Development Commands

### Starting Development

```bash
# Start both nexploy and docker-api (recommended for full development)
pnpm dev

# Start only the main Next.js app (port 3000)
pnpm dev:nexploy

# Start only the Docker API service (port 3300)
pnpm dev:docker-api

# Start desktop Electron app (port 3001)
pnpm dev:desktop
```

### Building

```bash
# Build all apps using Turbo
pnpm build

# Build specific app
pnpm --filter=nexploy build
pnpm --filter=docker-api build
```

### Database Operations

```bash
# Run migrations in development (creates migration files)
pnpm --filter=nexploy db:migrate:dev

# Apply migrations in production
pnpm --filter=nexploy db:migrate:prod

# Generate Prisma client after schema changes
pnpm --filter=nexploy db:generate

# Create migration file without applying
pnpm --filter=nexploy db:migrate:only

# Reset database and re-run all migrations
pnpm --filter=nexploy db:reset

# Open Prisma Studio (database GUI)
pnpm --filter=nexploy db:studio
```

### Code Quality

```bash
# Lint all apps
pnpm lint

# Fix linting issues
pnpm --filter=nexploy lint:fix

# Type check all TypeScript
pnpm types

# Format all code
pnpm format

# Type check with Turbo
pnpm check-types
```

## Architecture

### Monorepo Structure

This is a **pnpm + Turborepo** monorepo with workspace packages:

**Apps:**
- `apps/nexploy` - Main Next.js 16 app (port 3000) with custom server, handles UI and orchestration
- `apps/docker-api` - Hono.js API service (port 3300) that manages all Docker operations
- `apps/desktop` - Electron app sharing UI components

**Packages:**
- `@workspace/ui` - Shared shadcn/ui components (Radix UI + Tailwind)
- `@workspace/schemas-zod` - Zod validation schemas
- `@workspace/typescript-interface` - Shared TypeScript types
- `@workspace/i18n` - Internationalization utilities
- `@workspace/eslint-config` - Shared ESLint config
- `@workspace/typescript-config` - Shared TypeScript config

### Key Architectural Patterns

#### Server Actions Pattern (nexploy)

Primary API pattern using `next-safe-action` with Zod validation:

**Location:** `/apps/nexploy/src/actions/**/*.action.ts`

**Pattern:**
```typescript
export const myAction = authActionServer
  .inputSchema(mySchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user - authenticated user
    // parsedInput - validated input
  });
```

Middleware chain: Error handling → Authentication → Session context

#### State Management Architecture

**Client-side (Zustand + SSE):**
- Location: `/apps/nexploy/src/stores/**`
- Pattern: Zustand stores connected to SSE via `SSEMultiplexer`
- Real-time sync: Docker state → SSE → Zustand → React re-render
- Example stores: `useContainersStore`, `useDockerStore`, `useRequestsStore`

**Server-side (State Managers):**
- Location: `/apps/docker-api/src/managers/**`
- Base class: `BaseStateManager` with polling/reconnect logic
- Pattern: In-memory Map + Event emitter + Docker event listener
- Examples: `containersStateManager`, `imagesStateManager`, `traefikLogsManager`

#### Real-Time Communication

**SSE Multiplexer:**
- Single EventSource connection multiplexes multiple channels
- URL pattern: `/api/events/multiplexed?channels=containers,images,docker`
- Server maintains WebSocket-to-REST proxy for Docker terminal access
- Custom WebSocket routing in `server.ts` proxies to docker-api

#### API Architecture

**nexploy (Next.js):**
- Server Actions: Primary pattern for mutations
- API Routes: `/apps/nexploy/src/app/api/**`
  - `/api/[...all]/route.ts` - Better Auth endpoints
  - `/api/inngest/route.ts` - Background job webhook
  - Webhooks for GitHub/GitLab
  - SSE multiplexer for real-time updates

**docker-api (Hono.js):**
- REST API with route modularization
- Pattern: Manager → Route → SSE Events
- Managers poll Docker daemon and emit SSE updates

### Database (Prisma)

**Location:** `/apps/nexploy/prisma/schema.prisma`

**Core Models:**
- `User` - Authentication (Better Auth)
- `Repository` - Git repositories to deploy
- `Build` - Build history with status tracking (QUEUED → BUILDING → DEPLOYING → COMPLETED/FAILED/CANCELLED)
- `Log` - Build logs per step
- `EnvVariable` - Encrypted environment variables (AES-256-CBC)
- `Session/Account/Verification/TwoFactor` - Auth tables

**Key Patterns:**
- Single Prisma instance: `/apps/nexploy/prisma/prisma.ts`
- Service layer: `/apps/nexploy/src/services/**/*.service.ts`
- Migrations: `/apps/nexploy/prisma/migrations/`
- Generated client: `/apps/nexploy/generated/client/`

### Authentication (Better Auth)

**Implementation:** `/apps/nexploy/src/lib/auth/auth.ts`

**Features:**
- Email/password + OAuth (GitHub, GitLab)
- Two-factor authentication (TOTP) with backup codes
- Admin plugin for user management
- Session-based with cookie auth

**Authorization:**
- Server Action middleware: `authActionServer` wrapper
- Session context passed to authenticated actions
- OAuth token refresh via `getValidToken()`

**Security:**
- Encrypted environment variables (AES-256-CBC) - see `/apps/nexploy/src/lib/encryption.ts`
- Webhook secrets for Git provider callbacks
- CSRF protection via Better Auth

### Background Jobs (Inngest)

**Location:** `/apps/nexploy/src/inngest/`

**Build Pipeline Function:**
- ID: `build-pipeline`
- Trigger: `build/start` event
- Cancellation: `build/cancel` event

**Build Steps (resumable):**
1. `clone-repository` - Git clone with OAuth token
2. `prepare-dockerfile` - Copy/validate Dockerfile
3. `write-env-file` - Create .env from encrypted variables
4. `build-docker-image` - Docker build via docker-api SSE stream
5. `deploy-container` - Create and start container
6. `cleanup` - Remove temporary files
7. `finalize-logs` - Mark build complete

**Key Features:**
- Step-by-step execution with durability
- Real-time log streaming via channels (`build:{buildId}`)
- Resume from any failed step (stored in `Build.lastCompletedStep`)
- Abort controller for cancellation

### Infrastructure

**Development (docker-compose.dev.yml):**
- PostgreSQL: Port 5433
- Inngest Dev Server: Port 8288
- Traefik: Ports 80 (HTTP), 8080 (dashboard)

**Traefik:**
- Dynamic file provider: watches `/infra/traefik/service/`
- Docker provider: watches Docker socket
- Per-repository config files with routers/middlewares
- Let's Encrypt certificate resolver

**WebSocket Proxy:**
- Custom Next.js server handles WebSocket upgrades
- Routes: `/api/ws/docker/terminal/:containerId/:shell` → docker-api
- Proxies Docker terminal/attach WebSockets

## Common Workflows

### Adding a New Docker Feature

1. Create/modify manager in `/apps/docker-api/src/managers/`
2. Add route handler in `/apps/docker-api/src/routes/`
3. Update frontend store in `/apps/nexploy/src/stores/`
4. Add UI components using shadcn/ui
5. Subscribe to SSE channel in multiplexer

### Adding a New Repository Feature

1. Update Prisma schema if needed
2. Run `pnpm --filter=nexploy db:migrate:dev`
3. Create Zod schema in `@workspace/schemas-zod`
4. Create server action in `/apps/nexploy/src/actions/repository/`
5. Create service method in `/apps/nexploy/src/services/repository.service.ts`
6. Update UI components and forms

### Adding Environment Variable Support

Environment variables are encrypted at rest:
- Encryption implementation: `/apps/nexploy/src/lib/encryption.ts`
- Schema: `/packages/schemas-zod/src/repository/envVariable.schema.ts`
- Action: `/apps/nexploy/src/actions/repository/envVariable.action.ts`
- Written to `.env` file during build step in Inngest

### Creating a Background Job

1. Create function in `/apps/nexploy/src/inngest/functions/`
2. Register in `/apps/nexploy/src/inngest/client.ts`
3. Trigger with `inngest.send({ name: "event/name", data: {} })`
4. Use `step.run()` for resumable steps
5. Use channels for real-time updates

## Important Notes

### Deployment Flow

```
User Action → Server Action → Prisma/Inngest → docker-api → Docker Daemon
                                                     ↓
Docker Events → State Manager → SSE → SSEMultiplexer → Zustand → UI
```

### Terminology

Recent migration (check git history):
- "Projects" was renamed to "Repositories" across the codebase
- Search for both terms when exploring older code/migrations

### Next.js Custom Server

The nexploy app uses a custom server (`server.ts`) for:
- WebSocket proxy to docker-api
- Custom middleware before Next.js request handling
- Port: 3000 (dev), configurable via PORT env var

### Encryption Keys

Environment variables are encrypted using keys from:
- `ENCRYPTION_KEY` - Main encryption key (32 bytes hex)
- See `/apps/nexploy/src/lib/encryption.ts` for implementation

### Testing

- Docker API must be running for full integration testing
- Use Prisma Studio to inspect database state during development
- Inngest dev server provides UI at http://localhost:8288

### Component Library

Use shadcn/ui components from `@workspace/ui`:
- Add new components: `pnpm dlx shadcn@latest add <component> -c apps/nexploy`
- Components placed in `/packages/ui/src/components/`
- Import: `import { Button } from '@workspace/ui/components/button'`

### Internationalization

- Uses `next-intl` for i18n
- Locale prefix in routes: `/[locale]/(auth|app)/...`
- Translations in `@workspace/i18n` package

### Git Provider Integration

OAuth scopes required:
- **GitHub:** `repo` (full repository access)
- **GitLab:** `api` (API access)
- Token refresh handled by `getValidToken()` in services
- Webhook configuration stored per repository
