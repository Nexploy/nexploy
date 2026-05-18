import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { waitForPortConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { checkPort } from '@/inngest/pipeline/services/network.service';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { z } from 'zod';
import { ContainerInspectInfo } from 'dockerode';

export class WaitForPortExecutor implements INodeExecutor {
    readonly type = 'wait-for-port';
    readonly configSchema = waitForPortConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof waitForPortConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const containerId = nodeConfig.containerId as string;
        const port = nodeConfig.port as number;
        const timeout = nodeConfig.timeout as number;
        const interval = nodeConfig.interval as number;
        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        const inspectResult = await kyDocker
            .get(`container/${encodeURIComponent(containerId)}`, {
                signal: abortSignal,
                environmentId,
            } as KyDockerOptions)
            .json<ContainerInspectInfo>();

        const networks = inspectResult?.NetworkSettings?.Networks ?? {};
        const host = Object.values(networks).find((n) => n.IPAddress)?.IPAddress ?? containerId;
        const containerName = inspectResult?.Name?.replace(/^\//, '') ?? containerId;

        await logger.info(nodeId, `Waiting for ${containerName}:${port} to be open (timeout: ${timeout}s)`);

        const deadline = Date.now() + timeout * 1000;

        while (Date.now() < deadline) {
            if (abortSignal.aborted) throw new Error('Aborted');

            const open = await checkPort(host, port, Math.min(interval * 1000, 5000));
            if (open) {
                await logger.info(nodeId, `Port ${containerName}:${port} is open`);
                return { output: { containerId, port, open: true } };
            }

            await logger.debug(
                nodeId,
                `Port ${containerName}:${port} not yet open, retrying in ${interval}s`,
            );
            await new Promise<void>((resolve) => setTimeout(resolve, interval * 1000));
        }

        throw new Error(`Port ${containerName}:${port} was not open within ${timeout}s`);
    }
}

export const waitForPortExecutor = new WaitForPortExecutor();
