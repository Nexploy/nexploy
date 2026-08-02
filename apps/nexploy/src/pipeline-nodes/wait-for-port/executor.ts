import { getFromClosestAncestor } from '@workspace/pipeline-core/helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { waitForPortConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { checkPort } from '@workspace/pipeline-core/net';
import { z } from 'zod';
import { ContainerInspectInfo } from 'dockerode';

export class WaitForPortExecutor implements INodeExecutor {
    readonly type = 'wait-for-port';
    readonly configSchema = waitForPortConfigSchema;

    async execute(ctx: NodeExecutionContext<z.infer<typeof waitForPortConfigSchema>>): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const containerId = nodeConfig.containerId as string;
        const port = nodeConfig.port as number;
        const timeout = nodeConfig.timeout as number;
        const interval = nodeConfig.interval as number;
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        const inspectResult = await ctx.services.docker
            .get(`container/${encodeURIComponent(containerId)}`, {
                signal: abortSignal,
                environmentId,
            })
            .json<ContainerInspectInfo>();

        const containerName = inspectResult?.Name?.replace(/^\//, '') ?? containerId;

        const portKey = `${port}/tcp`;
        const portBindings = inspectResult?.NetworkSettings?.Ports?.[portKey];
        const hostPort = portBindings?.[0]?.HostPort ? Number(portBindings[0].HostPort) : port;
        const host = portBindings?.[0]?.HostPort
            ? '127.0.0.1'
            : (Object.values(inspectResult?.NetworkSettings?.Networks ?? {}).find((n) => n.IPAddress)?.IPAddress ??
              '127.0.0.1');

        await logger.info(nodeId, `Waiting for ${containerName}:${port} to be open (timeout: ${timeout}s)`);

        const deadline = Date.now() + timeout * 1000;

        while (Date.now() < deadline) {
            if (abortSignal.aborted) throw new Error('Aborted');

            const open = await checkPort(host, hostPort, Math.min(interval * 1000, 5000));
            if (open) {
                await logger.info(nodeId, `Port ${containerName}:${port} is open`);
                return { output: { containerId, port, open: true } };
            }

            await logger.debug(nodeId, `Port ${containerName}:${port} not yet open, retrying in ${interval}s`);
            await new Promise<void>((resolve) => setTimeout(resolve, interval * 1000));
        }

        throw new Error(`Port ${containerName}:${port} was not open within ${timeout}s`);
    }
}

export const waitForPortExecutor = new WaitForPortExecutor();
