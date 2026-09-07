import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import {
    AGENT_ENVIRONMENT_HEADER,
    AGENT_ID_HEADER,
    AGENT_PROTOCOL_HEADER,
    AGENT_PROTOCOL_VERSION,
    AGENT_SYSTEM_HEADER,
    AGENT_TUNNEL_PATH,
    decodeAgentSystemInfo,
} from '@nexploy/agent/protocol';
import {
    markDockerAgentOffline,
    markDockerAgentOnline,
    touchDockerAgent,
    verifyDockerAgentToken,
} from '@/services/environment/dockerAgent.service';
import { getDockerApiProxy } from '@/server/proxies';

const TOUCH_INTERVAL_MS = 60_000;

function denyUpgrade(socket: Socket, status: number, reason: string): void {
    console.warn(`⚠️ Agent upgrade refused: ${status} ${reason}`);
    socket.write(`HTTP/1.1 ${status} ${reason}\r\n\r\n`);
    socket.destroy();
}

function readBearerToken(req: IncomingMessage): string | null {
    const header = req.headers.authorization;

    if (!header) return null;

    const [scheme, token] = header.split(' ');

    return scheme === 'Bearer' && token ? token : null;
}

function readHeader(req: IncomingMessage, name: string): string | undefined {
    const value = req.headers[name];

    return Array.isArray(value) ? value[0] : value;
}

export async function handleAgentUpgrade(req: IncomingMessage, socket: Socket, head: Buffer): Promise<void> {
    const protocolVersion = Number(readHeader(req, AGENT_PROTOCOL_HEADER) ?? AGENT_PROTOCOL_VERSION);

    if (protocolVersion !== AGENT_PROTOCOL_VERSION) {
        denyUpgrade(socket, 426, 'Upgrade Required');
        return;
    }

    const token = readBearerToken(req);

    if (!token) {
        denyUpgrade(socket, 401, 'Unauthorized');
        return;
    }

    const agent = await verifyDockerAgentToken(token).catch(() => null);

    if (!agent) {
        denyUpgrade(socket, 401, 'Unauthorized');
        return;
    }

    const system = decodeAgentSystemInfo(readHeader(req, AGENT_SYSTEM_HEADER));

    await markDockerAgentOnline(agent.id, system);

    const touchTimer = setInterval(() => {
        void touchDockerAgent(agent.id);
    }, TOUCH_INTERVAL_MS);

    socket.once('close', () => {
        clearInterval(touchTimer);
        void markDockerAgentOffline(agent.id);
        console.log(`🔌 Agent disconnected: ${agent.id} (environment ${agent.environmentId})`);
    });

    delete req.headers.authorization;
    req.headers[AGENT_ID_HEADER] = agent.id;
    req.headers[AGENT_ENVIRONMENT_HEADER] = agent.environmentId;
    req.url = `${AGENT_TUNNEL_PATH}?environment=${encodeURIComponent(agent.environmentId)}&agent=${encodeURIComponent(agent.id)}`;

    console.log(`🔌 Agent connected: ${agent.id} (environment ${agent.environmentId})`);

    getDockerApiProxy().upgrade(req, socket, head);
}
