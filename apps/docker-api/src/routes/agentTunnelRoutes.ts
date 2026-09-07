import { Hono } from 'hono';
import type { UpgradeWebSocket } from 'hono/ws';
import type { WebSocket } from 'ws';
import { MuxSession } from '@nexploy/agent/protocol';
import { logger } from '@/utils/logger';
import { agentTunnelRegistry } from '@/lib/agentTunnelRegistry';

async function toBuffer(data: unknown): Promise<Buffer | null> {
    if (Buffer.isBuffer(data)) return data;
    if (data instanceof ArrayBuffer) return Buffer.from(data);
    if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    if (data instanceof Blob) return Buffer.from(await data.arrayBuffer());

    return null;
}

export const createAgentTunnelRoutes = (
    upgradeWebSocket: UpgradeWebSocket<WebSocket, { onError: (err: unknown) => void }>,
) => {
    const app = new Hono();

    app.get(
        '/tunnel',
        upgradeWebSocket((c) => {
            const environmentId = c.req.query('environment');
            const agentId = c.req.query('agent');

            let session: MuxSession | null = null;

            return {
                async onOpen(_, ws) {
                    if (!environmentId || !agentId) {
                        logger.warn('Agent tunnel opened without an environment or agent id');
                        ws.close(4400, 'missing environment');
                        return;
                    }

                    const raw = ws.raw;

                    session = new MuxSession(
                        {
                            sendBinary: (data) => {
                                if (raw && raw.readyState === 1) raw.send(data, { binary: true });
                                else if (ws.readyState === 1) ws.send(new Uint8Array(data));
                            },
                            isOpen: () => ws.readyState === 1,
                        },
                        'initiator',
                    );

                    try {
                        await agentTunnelRegistry.attach(environmentId, agentId, session);
                    } catch (err) {
                        logger.error({ err, environmentId, agentId }, 'Failed to attach the agent tunnel');
                        ws.close(4500, 'attach failed');
                    }
                },

                async onMessage(event) {
                    if (!session) return;

                    const chunk = await toBuffer(event.data);

                    if (!chunk) return;

                    session.handleBinary(chunk);
                },

                async onClose() {
                    if (!environmentId || !session) return;

                    await agentTunnelRegistry.detach(environmentId, session);
                    session = null;
                },

                onError(err) {
                    logger.error({ err, environmentId, agentId }, 'Agent tunnel socket error');
                },
            };
        }),
    );

    return app;
};
