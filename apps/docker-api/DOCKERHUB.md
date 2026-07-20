# Nexploy Docker API

Hono-based API service that manages all Docker operations (containers, images, volumes, networks, events) for [Nexploy](https://hub.docker.com/r/nexploy/nexploy), a self-hosted alternative to Vercel/Netlify, powered by Docker. Exposes a REST API, Server-Sent Events for real-time state, and a WebSocket terminal for interactive container shell access.

- **Source:** https://github.com/Nexploy/nexploy
- **Install script:** `curl -fsSL https://nexploy.app/install.sh | sh`
- **Companion image:** [`nexploy/nexploy`](https://hub.docker.com/r/nexploy/nexploy) is the main app that talks to this API

## Pull

```bash
docker pull nexploy/docker-api:latest
```

## Run

```bash
docker run -d \
  --name docker-api \
  -p 3300:3300 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  nexploy/docker-api:latest
```

The service needs access to the Docker socket to manage containers, images, volumes, and networks on the host.

## Environment variables

| Variable | Description |
|---|---|
| `DOCKER_SOCKET` | Path to the Docker socket (default: `/var/run/docker.sock`) |
| `PORT` | Port the API listens on (default: `3300`) |

## Tags

- `latest` — most recent stable release
- `<major>.<minor>.<patch>`, `<major>.<minor>`, `<major>` — pinned versions, see [Releases](https://github.com/Nexploy/nexploy/releases)

## Platforms

`linux/amd64`, `linux/arm64`
