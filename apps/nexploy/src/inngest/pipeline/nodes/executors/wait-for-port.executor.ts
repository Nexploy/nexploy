import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { waitForPortConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { checkPort } from '@/inngest/pipeline/services/network.service';
import { z } from 'zod';

export class WaitForPortExecutor implements INodeExecutor {
    readonly type = 'wait-for-port';
    readonly configSchema = waitForPortConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof waitForPortConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const host = nodeConfig.host as string;
        const port = nodeConfig.port as number;
        const timeout = nodeConfig.timeout as number;
        const interval = nodeConfig.interval as number;

        await logger.info(nodeId, `Waiting for ${host}:${port} to be open (timeout: ${timeout}s)`);

        const deadline = Date.now() + timeout * 1000;

        while (Date.now() < deadline) {
            if (abortSignal.aborted) throw new Error('Aborted');

            const open = await checkPort(host, port, Math.min(interval * 1000, 5000));
            if (open) {
                await logger.info(nodeId, `Port ${host}:${port} is open`);
                return { output: { host, port, open: true } };
            }

            await logger.debug(
                nodeId,
                `Port ${host}:${port} not yet open, retrying in ${interval}s`,
            );
            await new Promise<void>((resolve) => setTimeout(resolve, interval * 1000));
        }

        throw new Error(`Port ${host}:${port} was not open within ${timeout}s`);
    }
}

export const waitForPortExecutor = new WaitForPortExecutor();
