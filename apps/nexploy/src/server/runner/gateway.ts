import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import { WebSocketServer, type WebSocket } from 'ws';
import {
    markBuildRunnerOffline,
    markBuildRunnerOnline,
    touchBuildRunner,
    verifyBuildRunnerToken,
} from '@/services/buildRunner.service';
import {
    decodeRunnerMessage,
    RUNNER_PROTOCOL_HEADER,
    RUNNER_PROTOCOL_VERSION,
    type ServerMessage,
} from '@/server/runner/protocol';
import { attachRunner, detachRunner, getConnectedRunner, handleRunnerMessage } from '@/server/runner/runnerHub';

const HEARTBEAT_INTERVAL_MS = 20_000;
const HELLO_TIMEOUT_MS = 15_000;
const STALE_CONNECTION_MS = 90_000;

let wss: WebSocketServer | null = null;

function getServer(): WebSocketServer {
    wss ??= new WebSocketServer({ noServer: true, maxPayload: 1_048_576 });
    return wss;
}

function denyUpgrade(socket: Socket, status: number, reason: string): void {
    console.warn(`⚠️ Build runner upgrade refused: ${status} ${reason}`);
    socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
    socket.destroy();
}

function readBearerToken(req: IncomingMessage): string | null {
    const header = req.headers.authorization;
    if (!header) return null;

    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
}

function send(socket: WebSocket, message: ServerMessage): void {
    if (socket.readyState !== socket.OPEN) return;
    socket.send(JSON.stringify(message));
}

export async function handleRunnerUpgrade(req: IncomingMessage, socket: Socket, head: Buffer): Promise<void> {
    console.log(`🔌 Build runner upgrade from ${req.socket.remoteAddress ?? 'unknown'}`);

    const protocolVersion = Number(req.headers[RUNNER_PROTOCOL_HEADER] ?? RUNNER_PROTOCOL_VERSION);

    if (protocolVersion !== RUNNER_PROTOCOL_VERSION) {
        denyUpgrade(socket, 426, 'Upgrade Required');
        return;
    }

    const token = readBearerToken(req);

    if (!token) {
        denyUpgrade(socket, 401, 'Unauthorized');
        return;
    }

    getServer().handleUpgrade(req, socket, head, (ws) => {
        void authenticateSocket(ws, token);
    });
}

async function authenticateSocket(ws: WebSocket, token: string): Promise<void> {
    const pending: Buffer[] = [];
    const collect = (raw: Buffer) => pending.push(raw);

    ws.on('message', collect);

    const runner = await verifyBuildRunnerToken(token).catch(() => null);

    ws.off('message', collect);

    if (!runner) {
        console.warn('⚠️ Build runner presented an invalid token');
        send(ws, { type: 'error', code: 'unauthorized', message: 'Invalid runner token', fatal: true });
        ws.close(4401, 'unauthorized');
        return;
    }

    if (ws.readyState !== ws.OPEN) {
        console.warn(`⚠️ Build runner socket closed before authentication finished (${runner.name})`);
        return;
    }

    bindRunnerSocket(ws, runner.id, runner.name);

    for (const raw of pending) ws.emit('message', raw);
}

function bindRunnerSocket(ws: WebSocket, runnerId: string, runnerName: string): void {
    let registered = false;

    const helloTimer = setTimeout(() => {
        if (registered) return;
        send(ws, { type: 'error', code: 'hello_timeout', message: 'No hello received', fatal: true });
        ws.close(4008, 'hello timeout');
    }, HELLO_TIMEOUT_MS);

    const heartbeatTimer = setInterval(() => {
        if (ws.readyState !== ws.OPEN) return;
        send(ws, { type: 'ping' });
    }, HEARTBEAT_INTERVAL_MS);

    const staleTimer = setInterval(() => {
        const connected = registered ? (getConnectedRunner(runnerId)?.lastSeenAt ?? Date.now()) : Date.now();
        if (Date.now() - connected > STALE_CONNECTION_MS) {
            console.warn(`⚠️ Build runner ${runnerName} stopped sending heartbeats, closing`);
            ws.close(4010, 'heartbeat timeout');
        }
    }, HEARTBEAT_INTERVAL_MS);

    const cleanup = () => {
        clearTimeout(helloTimer);
        clearInterval(heartbeatTimer);
        clearInterval(staleTimer);
    };

    ws.on('message', (raw) => {
        const message = decodeRunnerMessage(raw as Buffer);

        if (!message) {
            send(ws, { type: 'error', code: 'invalid_frame', message: 'Frame does not match the runner protocol' });
            return;
        }

        if (message.type === 'hello') {
            if (registered) return;

            registered = true;
            clearTimeout(helloTimer);

            attachRunner({ runnerId, name: runnerName, socket: ws, capabilities: message.capabilities });

            send(ws, {
                type: 'hello.ack',
                runnerId,
                serverVersion: process.env.npm_package_version,
                heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
                protocolVersion: RUNNER_PROTOCOL_VERSION,
            });

            console.log(`🏗️ Build runner connected: ${runnerName} (${message.capabilities.platforms.join(', ')})`);

            void markBuildRunnerOnline(runnerId, {
                version: message.runnerVersion,
                platforms: message.capabilities.platforms,
                maxConcurrency: message.capabilities.maxConcurrency,
            });

            return;
        }

        if (!registered) return;

        handleRunnerMessage(runnerId, message);

        if (message.type === 'heartbeat') {
            void touchBuildRunner(runnerId, message.load.activeJobs, message.load.maxConcurrency === 0);
        }
    });

    ws.on('close', (code, reason) => {
        cleanup();

        const detail = `code ${code}${reason?.length ? ` — ${reason.toString()}` : ''}`;

        if (!registered) {
            console.warn(`⚠️ Build runner socket closed before hello: ${runnerName} (${detail})`);
            return;
        }

        if (getConnectedRunner(runnerId)?.socket !== ws) {
            console.warn(`⚠️ Stale build runner socket closed: ${runnerName} (${detail})`);
            return;
        }

        detachRunner(runnerId, ws);
        void markBuildRunnerOffline(runnerId);
        console.log(`🏗️ Build runner disconnected: ${runnerName} (${detail})`);
    });

    ws.on('error', (error) => {
        console.error(`❌ Build runner socket error (${runnerName}):`, error.message);
    });
}
