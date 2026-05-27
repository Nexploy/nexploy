# ---- Base ----
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat su-exec git
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# ---- Prepare (prune monorepo to nexploy scope) ----
FROM base AS prepare
WORKDIR /app
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune nexploy --docker

# ---- Deps (install from pruned lockfile) ----
FROM base AS deps
WORKDIR /app
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ---- Builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prepare /app/out/full/ .

# Generate Prisma client
RUN pnpm --filter=nexploy db:generate

# Build Next.js (standalone mode - output has no build cache)
RUN pnpm --filter=./apps/nexploy run build && \
    rm -rf apps/nexploy/.next/cache apps/nexploy/.next/dev

# Bundle custom server.ts → server.cjs
RUN pnpm add -g esbuild && esbuild apps/nexploy/server.ts \
    --bundle \
    --platform=node \
    --format=cjs \
    --outfile=apps/nexploy/server.cjs \
    --external:next

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/.next/static ./apps/nexploy/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/public ./apps/nexploy/public

# Custom server (WebSocket proxy + Next.js handler)
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/server.cjs ./apps/nexploy/server.cjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/package.json ./apps/nexploy/package.json

# Prisma generated client
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/generated ./apps/nexploy/generated

# Files needed by entrypoint (migrations + seed via tsx + Better Auth)
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/prisma ./apps/nexploy/prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/src ./apps/nexploy/src
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/tsconfig.json ./apps/nexploy/tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Full node_modules for Prisma, seeding, and runtime deps
# (overrides standalone's minimal node_modules)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

COPY --from=builder /app/apps/nexploy/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

WORKDIR /app/apps/nexploy
ENTRYPOINT ["/entrypoint.sh"]
