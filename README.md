# Nexploy

A self-hosted Docker deployment platform that deploys applications from Git repositories to Docker containers with automatic HTTPS, real-time monitoring, and a modern web interface.

Think **Vercel** or **Netlify**, but self-hosted with Docker.

## Features

- **Git Integration** - Deploy from GitHub and GitLab repositories with OAuth authentication
- **Automated Builds** - Background build pipeline with step-by-step execution and resumability
- **Docker Management** - Full container, image, volume, and network management
- **Traefik Integration** - Automatic reverse proxy configuration with Let's Encrypt SSL
- **Real-time Updates** - Live build logs, container stats, and Docker events via Server-Sent Events
- **Environment Variables** - Encrypted environment variable management (AES-256-CBC)
- **Terminal Access** - In-browser Docker container terminal with WebSocket support
- **Multi-architecture** - Web app, desktop app (Electron), and headless API
- **Two-Factor Auth** - TOTP-based 2FA with backup codes
- **Internationalization** - Multi-language support with next-intl

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- PostgreSQL (or use included docker-compose setup)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nexploy.git
cd nexploy

# Install dependencies
pnpm install

# Set up environment variables
cp apps/nexploy/.env.example apps/nexploy/.env
cp apps/docker-api/.env.example apps/docker-api/.env

# Start infrastructure (PostgreSQL, Inngest, Traefik)
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
pnpm --filter=nexploy db:migrate:dev

# Start development servers
pnpm dev
```

The app will be available at:
- **Web App:** http://localhost:3000
- **Docker API:** http://localhost:3300
- **Inngest Dev Server:** http://localhost:8288
- **Traefik Dashboard:** http://localhost:8080

## Development

### Available Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm dev:nexploy      # Start only Next.js app (port 3000)
pnpm dev:docker-api   # Start only Docker API (port 3300)
pnpm dev:desktop      # Start Electron desktop app (port 3001)

# Building
pnpm build            # Build all apps with Turbo
pnpm --filter=nexploy build

# Database
pnpm --filter=nexploy db:migrate:dev   # Create and run migrations
pnpm --filter=nexploy db:migrate:prod  # Run migrations in production
pnpm --filter=nexploy db:generate      # Generate Prisma client
pnpm --filter=nexploy db:studio        # Open Prisma Studio GUI
pnpm --filter=nexploy db:reset         # Reset database

# Code Quality
pnpm lint             # Lint all apps
pnpm lint:fix         # Fix linting issues
pnpm types            # Type check TypeScript
pnpm format           # Format code with Prettier
pnpm check-types      # Type check with Turbo
```

## Architecture

### Monorepo Structure

Built with **pnpm workspaces** and **Turborepo**:

```
nexploy/
├── apps/
│   ├── nexploy/          # Next.js 16 app with custom server (UI + orchestration)
│   ├── docker-api/       # Hono.js API service for Docker operations
│   └── desktop/          # Electron desktop app
├── packages/
│   ├── ui/               # Shared shadcn/ui components (Radix + Tailwind)
│   ├── schemas-zod/      # Zod validation schemas
│   ├── typescript-interface/  # Shared TypeScript types
│   ├── i18n/             # Internationalization utilities
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
└── infra/
    └── traefik/          # Traefik configuration and dynamic configs
```

### Technology Stack

**Frontend:**
- Next.js 16 (App Router with Server Actions)
- React 19
- Tailwind CSS + shadcn/ui components
- Zustand (state management)
- Nuqs (URL state management)

**Backend:**
- Hono.js (Docker API)
- Next.js Server Actions (primary API pattern)
- Prisma ORM + PostgreSQL
- Better Auth (authentication)
- Inngest (background jobs)

**Infrastructure:**
- Docker + Docker Compose
- Traefik (reverse proxy)
- Server-Sent Events (real-time updates)
- WebSocket (terminal access)

### Key Patterns

#### Server Actions (Primary API)

```typescript
// apps/nexploy/src/actions/**/*.action.ts
export const myAction = authActionServer
  .inputSchema(mySchema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user - authenticated user
    // parsedInput - Zod-validated input
  });
```

#### Real-time State Management

```
Docker Events → State Manager → SSE → SSEMultiplexer → Zustand → React UI
```

- **Client:** Zustand stores connected to SSE channels
- **Server:** BaseStateManager classes with Docker event listeners
- **Transport:** Single SSE connection multiplexes multiple channels

#### Build Pipeline

Background jobs powered by Inngest with resumable steps:

1. Clone repository (with OAuth token)
2. Prepare Dockerfile
3. Write encrypted environment variables
4. Build Docker image (with streaming logs)
5. Deploy container with Traefik routing
6. Cleanup and finalize

## Project Structure

```
apps/nexploy/
├── prisma/                    # Database schema and migrations
├── src/
│   ├── actions/              # Next.js Server Actions (Zod-validated)
│   ├── app/                  # Next.js App Router pages and API routes
│   ├── components/           # React components
│   ├── inngest/              # Background job functions
│   ├── lib/                  # Utilities (auth, encryption, etc.)
│   ├── services/             # Business logic layer
│   └── stores/               # Zustand state management
└── server.ts                 # Custom Next.js server (WebSocket proxy)

apps/docker-api/
├── src/
│   ├── managers/             # Docker state managers (polling + events)
│   ├── routes/               # Hono.js route handlers
│   └── services/             # Docker SDK wrappers
└── index.ts                  # Hono.js app entry point

packages/ui/
└── src/components/           # Shared shadcn/ui components
```

## Authentication

**Better Auth** implementation with:

- Email/password authentication
- OAuth (GitHub, GitLab)
- Two-factor authentication (TOTP)
- Session-based with secure cookies
- Admin plugin for user management
- Token refresh for Git providers

## Deployment

### Production Build

```bash
# Build all apps
pnpm build

# Run migrations
pnpm --filter=nexploy db:migrate:prod

# Start production servers
NODE_ENV=production pnpm start
```

### Environment Variables

Key environment variables (see `.env.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nexploy"

# Encryption
ENCRYPTION_KEY="your-32-byte-hex-key"

# Better Auth
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# GitLab OAuth
GITLAB_CLIENT_ID=""
GITLAB_CLIENT_SECRET=""

# Inngest
INNGEST_EVENT_KEY="your-event-key"
INNGEST_SIGNING_KEY="your-signing-key"
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm lint && pnpm types`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add Zod schemas for validation

## Security

- Environment variables are encrypted at rest (AES-256-CBC)
- OAuth tokens are securely stored and auto-refreshed
- Webhook secrets validate Git provider callbacks
- CSRF protection via Better Auth
- Session-based authentication with secure cookies

## License

[Add your license here]

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Prisma](https://www.prisma.io/) - Database ORM
- [Better Auth](https://www.better-auth.com/) - Authentication
- [Inngest](https://www.inngest.com/) - Background jobs
- [Traefik](https://traefik.io/) - Reverse proxy
- [Hono](https://hono.dev/) - Fast web framework
