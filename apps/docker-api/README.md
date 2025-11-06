# Docker API Server

Hono-based API server for managing Docker containers, images, volumes, networks, and events with real-time SSE streams and WebSocket terminal support.

## Features

- **REST API** for Docker resources management
- **Server-Sent Events (SSE)** for real-time updates
- **WebSocket Terminal** for interactive container shell access
- State managers with automatic reconnection
- Event-driven architecture

## WebSocket Terminal

The server provides WebSocket support for interactive terminal access to containers.

### Endpoint

```
ws://localhost:3300/ws/docker/exec/:containerId
```

### Usage Example

```javascript
const ws = new WebSocket('ws://localhost:3300/ws/docker/exec/my-container-id');

ws.onopen = () => {
    console.log('Terminal connected');
};

ws.onmessage = (event) => {
    // Display output in terminal
    console.log(event.data);
};

// Send input to container
ws.send('ls -la\n');
```

### Implementation Details

- Uses `dockerode` to execute commands in containers
- Creates a TTY session with `/bin/sh`
- Bidirectional communication (stdin/stdout/stderr)
- Automatic cleanup on disconnect

### Client Integration

The WebSocket terminal can be integrated with terminal emulators like xterm.js:

```javascript
import { Terminal } from '@xterm/xterm';

const term = new Terminal();
term.open(document.getElementById('terminal'));

const ws = new WebSocket(`ws://localhost:3300/ws/docker/exec/${containerId}`);
ws.binaryType = 'arraybuffer';

term.onData((data) => {
    ws.send(data);
});

ws.onmessage = (event) => {
    if (typeof event.data === 'string') {
        term.write(event.data);
    } else {
        term.write(new Uint8Array(event.data));
    }
};
```

## Environment Variables

- `DOCKER_SOCKET` - Path to Docker socket (default: `/var/run/docker.sock`)

## Development

```bash
pnpm dev
```

Server runs on http://localhost:3300

## Build

```bash
pnpm build
```

## Start Production

```bash
pnpm start
```
