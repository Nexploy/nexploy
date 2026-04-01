import * as net from 'node:net';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';

function checkPort(host: string, port: number, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let resolved = false;

        const done = (result: boolean) => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                resolve(result);
            }
        };

        socket.setTimeout(timeoutMs);
        socket.once('connect', () => done(true));
        socket.once('error', () => done(false));
        socket.once('timeout', () => done(false));
        socket.connect(port, host);
    });
}

export class WaitForPortExecutor implements INodeExecutor {
    readonly type = 'wait-for-port';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const host = nodeConfig.host as string;
        const port = nodeConfig.port as number;
        if (!host) throw new Error('Host is required');
        if (!port) throw new Error('Port is required');

        const timeout = (nodeConfig.timeout as number | undefined) ?? 60;
        const interval = (nodeConfig.interval as number | undefined) ?? 3;

        await logger.info(nodeId, `Waiting for ${host}:${port} to be open (timeout: ${timeout}s)`);

        const deadline = Date.now() + timeout * 1000;

        while (Date.now() < deadline) {
            if (abortSignal.aborted) throw new Error('Aborted');

            const open = await checkPort(host, port, Math.min(interval * 1000, 5000));
            if (open) {
                await logger.info(nodeId, `Port ${host}:${port} is open`);
                return { success: true, output: { host, port, open: true } };
            }

            await logger.debug(nodeId, `Port ${host}:${port} not yet open, retrying in ${interval}s`);
            await new Promise<void>((resolve) => setTimeout(resolve, interval * 1000));
        }

        throw new Error(`Port ${host}:${port} was not open within ${timeout}s`);
    }
}

export const waitForPortExecutor = new WaitForPortExecutor();
