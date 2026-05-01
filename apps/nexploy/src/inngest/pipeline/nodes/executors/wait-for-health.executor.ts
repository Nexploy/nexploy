import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { waitForHealthConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class WaitForHealthExecutor implements INodeExecutor {
    readonly type = 'wait-for-health';
    readonly configSchema = waitForHealthConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof waitForHealthConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const containerName = nodeConfig.containerName;
        const timeout = nodeConfig.timeout;
        const interval = nodeConfig.interval;
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(
            nodeId,
            `Waiting for container "${containerName}" to be healthy (timeout: ${timeout}s)`,
        );

        const deadline = Date.now() + timeout * 1000;

        while (Date.now() < deadline) {
            if (abortSignal.aborted) throw new Error('Aborted');

            try {
                const result = await kyDocker
                    .get(`containers/${encodeURIComponent(containerName)}/inspect`, {
                        signal: abortSignal,
                        environmentId,
                    } as KyDockerOptions)
                    .json<{ State?: { Health?: { Status?: string } } }>();

                const healthStatus = result?.State?.Health?.Status;
                if (healthStatus === 'healthy') {
                    await logger.info(nodeId, `Container "${containerName}" is healthy`);
                    return { output: { containerName, healthy: true } };
                }

                await logger.debug(
                    nodeId,
                    `Health status: ${healthStatus ?? 'unknown'}, retrying in ${interval}s`,
                );
            } catch (err) {
                if (abortSignal.aborted) throw new Error('Aborted');
                await logger.debug(
                    nodeId,
                    `Inspect failed: ${err instanceof Error ? err.message : 'unknown error'}`,
                );
            }

            await new Promise<void>((resolve) => setTimeout(resolve, interval * 1000));
        }

        throw new Error(`Container "${containerName}" did not become healthy within ${timeout}s`);
    }
}

export const waitForHealthExecutor = new WaitForHealthExecutor();
