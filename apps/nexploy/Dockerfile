# ---- Base ----
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat su-exec
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app

# Copy workspace structure for pnpm install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc* ./
COPY apps/nexploy/package.json ./apps/nexploy/package.json
COPY apps/docker-api/package.json ./apps/docker-api/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/schemas-zod/package.json ./packages/schemas-zod/package.json
COPY packages/typescript-interface/package.json ./packages/typescript-interface/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM deps AS build
WORKDIR /app

# Copy all sources on top of installed deps
COPY . .

# Generate Prisma client
RUN pnpm --filter=nexploy db:generate

# Build Next.js
RUN pnpm --filter=nexploy build

# Bundle custom server.ts → server.cjs
RUN npm install -g esbuild && esbuild apps/nexploy/server.ts \
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
RUN npm install -g tsx

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
COPY apps/nexploy/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN chown -R nextjs:nodejs /app

EXPOSE 3000

WORKDIR /app/apps/nexploy
ENTRYPOINT ["/entrypoint.sh"]
