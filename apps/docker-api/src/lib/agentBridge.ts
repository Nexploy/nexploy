import { createServer, type Server } from 'node:net';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { MuxSession } from '@workspace/agent-protocol';
import { logger } from '@/utils/logger';

const BRIDGE_DIR = process.env.AGENT_BRIDGE_DIR || tmpdir();

export function agentSocketPath(environmentId: string): string {
    return join(BRIDGE_DIR, `nexploy-agent-${environmentId}.sock`);
}

async function removeSocketFile(path: string): Promise<void> {
    await unlink(path).catch(() => undefined);
}

export async function startAgentBridge(environmentId: string, session: MuxSession): Promise<Server> {
    const path = agentSocketPath(environmentId);

    await removeSocketFile(path);

    const server = createServer((connection) => {
        let channel: ReturnType<MuxSession['openChannel']>;

        try {
            channel = session.openChannel();
        } catch (error) {
            logger.warn({ error, environmentId }, 'Cannot open a tunnel channel, the agent is gone');
            connection.destroy();
            return;
        }

        connection.on('error', () => channel.destroy());
        channel.on('error', () => connection.destroy());

        connection.pipe(channel);
        channel.pipe(connection);
    });

    server.on('error', (error) => {
        logger.error({ error, environmentId, path }, 'Agent bridge socket error');
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(path, () => {
            server.off('error', reject);
            resolve();
        });
    });

    logger.info({ environmentId, path }, 'Agent bridge socket listening');

    return server;
}

export async function stopAgentBridge(server: Server, environmentId: string): Promise<void> {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await removeSocketFile(agentSocketPath(environmentId));

    logger.info({ environmentId }, 'Agent bridge socket closed');
}
