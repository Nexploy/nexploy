# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
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

# Bundle with esbuild (resolves path aliases and workspace imports)
RUN npm install -g esbuild && esbuild apps/docker-api/src/index.ts \
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
COPY apps/docker-api/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Runs as root to access /var/run/docker.sock

EXPOSE 3300

ENTRYPOINT ["/entrypoint.sh"]
