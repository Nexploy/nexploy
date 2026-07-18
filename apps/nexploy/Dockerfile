FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
ENV DO_NOT_TRACK=1
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat su-exec git
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

FROM base AS prepare
WORKDIR /app
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune nexploy --docker

FROM base AS deps
WORKDIR /app
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM base AS migrate-tools
WORKDIR /tools
COPY apps/nexploy/docker/migrate-tools/ ./
RUN pnpm install --node-linker=hoisted

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/ ./
COPY --from=prepare /app/out/full/ .
COPY --from=prepare /app/tsconfig.json ./tsconfig.json

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV BETTER_AUTH_SECRET="build-placeholder-secret-not-used-at-runtime"
ENV BETTER_AUTH_URL="http://localhost:3000"

RUN pnpm --filter=nexploy db:generate

RUN pnpm --filter=./apps/nexploy run build && \
    rm -rf apps/nexploy/.next/cache apps/nexploy/.next/dev

RUN pnpm add -g esbuild && esbuild apps/nexploy/server.ts \
    --bundle \
    --platform=node \
    --format=cjs \
    --outfile=apps/nexploy/server.cjs \
    --external:next

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/.next/static ./apps/nexploy/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/public ./apps/nexploy/public

COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/server.cjs ./apps/nexploy/server.cjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/package.json ./apps/nexploy/package.json

COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/generated ./apps/nexploy/generated

COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/prisma ./apps/nexploy/prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/prisma.config.ts ./apps/nexploy/prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/src ./apps/nexploy/src
COPY --from=builder --chown=nextjs:nodejs /app/apps/nexploy/tsconfig.json ./apps/nexploy/tsconfig.json
COPY --from=prepare --chown=nextjs:nodejs /app/infra/traefik/service ./apps/nexploy/traefik-templates
COPY --from=prepare --chown=nextjs:nodejs /app/infra/traefik/templates/traefik.yml.template ./apps/nexploy/traefik-templates/traefik.yml.template
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

COPY --from=migrate-tools --chown=nextjs:nodejs /tools/node_modules ./migrate-tools/node_modules
RUN for tool in /app/migrate-tools/node_modules/*; do \
        [ -e "/app/node_modules/$(basename "$tool")" ] || ln -s "$tool" "/app/node_modules/$(basename "$tool")"; \
    done

COPY --from=builder --chown=nextjs:nodejs /app/packages/typescript-config ./node_modules/@workspace/typescript-config

COPY --from=builder /app/apps/nexploy/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

WORKDIR /app/apps/nexploy
ENTRYPOINT ["/entrypoint.sh"]
