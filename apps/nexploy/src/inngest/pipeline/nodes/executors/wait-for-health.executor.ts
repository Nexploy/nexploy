import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { waitForHealthConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { ContainerInspectInfo } from 'dockerode';

export class WaitForHealthExecutor implements INodeExecutor {
    readonly type = 'wait-for-health';
    readonly configSchema = waitForHealthConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof waitForHealthConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const containerId = nodeConfig.containerId;
        const timeout = nodeConfig.timeout;
        const interval = nodeConfig.interval;
        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(
            nodeId,
            `Waiting for container "${containerId}" to be healthy (timeout: ${timeout}s)`,
        );

        const deadline = Date.now() + timeout * 1000;

        while (Date.now() < deadline) {
            if (abortSignal.aborted) throw new Error('Aborted');

            try {
                const result = await kyDocker
                    .get(`container/${encodeURIComponent(containerId)}`, {
                        signal: abortSignal,
                        environmentId,
                    } as KyDockerOptions)
                    .json<ContainerInspectInfo>();

                const healthStatus = result?.State?.Health?.Status;
                const runningStatus = result?.State?.Status;

                if (!healthStatus && runningStatus === 'running') {
                    await logger.info(
                        nodeId,
                        `Container "${containerId}" is running (no healthcheck configured)`,
                    );
                    return { output: { containerId, healthy: true } };
                }

                if (healthStatus === 'healthy') {
                    await logger.info(nodeId, `Container "${containerId}" is healthy`);
                    return { output: { containerId, healthy: true } };
                }

                await logger.debug(
                    nodeId,
                    `Health status: ${healthStatus ?? runningStatus ?? 'unknown'}, retrying in ${interval}s`,
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

        throw new Error(`Container "${containerId}" did not become healthy within ${timeout}s`);
    }
}

export const waitForHealthExecutor = new WaitForHealthExecutor();
