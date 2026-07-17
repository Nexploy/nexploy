# Nexploy

Self-hosted deployment platform for Docker. Deploy applications from Git repositories (GitHub/GitLab) to Docker containers with automatic HTTPS via Traefik, real-time monitoring, and a modern web interface.

Think Vercel/Netlify, but self-hosted.

- **Source:** https://github.com/Nexploy/nexploy
- **Install script:** `curl -fsSL https://nexploy.app/install.sh | sh`
- **Companion image:** [`nexploy/docker-api`](https://hub.docker.com/r/nexploy/docker-api) manages Docker operations for this app

## Pull

```bash
docker pull nexploy/nexploy:latest
```

## Run

```bash
docker run -d \
  --name nexploy \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/nexploy" \
  -e BETTER_AUTH_SECRET="your-random-secret" \
  -e BETTER_AUTH_URL="https://your-domain.com" \
  -e ENCRYPTION_KEY="32-byte-hex-key" \
  nexploy/nexploy:latest
```

The app listens on port `3000` and expects a reachable PostgreSQL database.

## Required environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret used to sign auth sessions |
| `BETTER_AUTH_URL` | Public URL the app is served from |
| `ENCRYPTION_KEY` | 32-byte hex key used to encrypt stored environment variables (AES-256-CBC) |

## Tags

- `latest` — most recent stable release
- `<major>.<minor>.<patch>`, `<major>.<minor>`, `<major>` — pinned versions, see [Releases](https://github.com/Nexploy/nexploy/releases)

## Platforms

`linux/amd64`, `linux/arm64`
