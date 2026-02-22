# ---- Base ----
FROM node:20-alpine AS base
# pnpm global bin dir (used for turbo, esbuild)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

# ---- Prepare (prune monorepo) ----
FROM base AS prepare
WORKDIR /app
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune docker-api --docker

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

# Bundle with esbuild (resolves path aliases and workspace imports)
RUN pnpm add -g esbuild && esbuild apps/docker-api/src/index.ts \
    --bundle \
    --platform=node \
    --format=cjs \
    --outfile=apps/docker-api/dist/index.cjs \
    --external:dockerode \
    --external:dockerode-compose \
    --external:ssh2 \
    --external:cpu-features \
    --external:tar-fs \
    --external:pino \
    --external:pino-pretty

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3300

# Copy bundled output
COPY --from=build /app/apps/docker-api/dist ./dist

# Copy node_modules for external packages
COPY --from=deps /app/node_modules ./node_modules

# Copy entrypoint script
COPY --from=build /app/apps/docker-api/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Runs as root to access /var/run/docker.sock

EXPOSE 3300

ENTRYPOINT ["/entrypoint.sh"]
