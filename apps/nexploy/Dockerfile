# ---- Base ----
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
# pnpm global bin dir (used for turbo, esbuild, tsx)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat su-exec
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# ---- Prepare (prune monorepo) ----
FROM base AS prepare
WORKDIR /app
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune nexploy --docker

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
# Copy pruned package manifests + workspace config
COPY --from=prepare /app/out/json/ .
# Override with the correctly pruned lockfile (out/pnpm-lock.yaml != out/json/pnpm-lock.yaml)
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
WORKDIR /app

# Bring in the pruned full source
COPY --from=prepare /app/out/full/ .

# Generate Prisma client
RUN pnpm --filter=nexploy db:generate

# Build Next.js
RUN pnpm --filter=nexploy build

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

# tsx needed to run prisma seed (imports Better Auth)
RUN pnpm add -g tsx

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy node_modules (full deps needed for custom server + next)
COPY --from=deps /app/node_modules ./node_modules

# Copy built Next.js app
COPY --from=build /app/apps/nexploy/.next ./apps/nexploy/.next
COPY --from=build /app/apps/nexploy/public ./apps/nexploy/public
COPY --from=build /app/apps/nexploy/package.json ./apps/nexploy/package.json

# Copy custom server
COPY --from=build /app/apps/nexploy/server.cjs ./apps/nexploy/server.cjs

# Copy generated Prisma client
COPY --from=build /app/apps/nexploy/generated ./apps/nexploy/generated

# Copy source files needed for seed (prisma/ + src/lib/auth for Better Auth)
COPY --from=build /app/apps/nexploy/prisma ./apps/nexploy/prisma
COPY --from=build /app/apps/nexploy/src ./apps/nexploy/src
COPY --from=build /app/apps/nexploy/tsconfig.json ./apps/nexploy/tsconfig.json

# Copy workspace packages (needed at runtime)
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json

# Copy entrypoint
COPY --from=build /app/apps/nexploy/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN chown -R nextjs:nodejs /app

EXPOSE 3000

WORKDIR /app/apps/nexploy
ENTRYPOINT ["/entrypoint.sh"]
