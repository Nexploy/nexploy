import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export class CheckContainerLogsExecutor implements INodeExecutor {
    readonly type = 'check-container-logs';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerName = nodeConfig.containerName as string;
        const pattern = nodeConfig.pattern as string;
        const since = nodeConfig.since as string | undefined;
        const timeout = (nodeConfig.timeout as number | undefined) ?? 30;
        const failIfFound = (nodeConfig.failIfFound as boolean | undefined) ?? false;

        if (!containerName) throw new Error('Container name is required');
        if (!pattern) throw new Error('Pattern is required');

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const regex = new RegExp(pattern);

        await logger.info(nodeId, `Checking logs of container "${containerName}" for pattern: ${pattern}`);

        const deadline = Date.now() + timeout * 1000;
        let found = false;
        let matchedLine = '';

        while (Date.now() < deadline && !found) {
            if (abortSignal.aborted) throw new Error('Aborted');

            try {
                const result = await kyDocker
                    .get(`containers/${encodeURIComponent(containerName)}/logs`, {
                        searchParams: {
                            tail: '100',
                            ...(since && { since }),
                        },
                        signal: abortSignal,
                        environmentId,
                    } as KyDockerOptions)
                    .json<{ logs: string }>();

                const lines = (result.logs ?? '').split('\n');
                for (const line of lines) {
                    if (regex.test(line)) {
                        found = true;
                        matchedLine = line;
                        break;
                    }
                }
            } catch (err) {
                if (abortSignal.aborted) throw new Error('Aborted');
                await logger.debug(nodeId, `Log fetch error: ${err instanceof Error ? err.message : 'unknown'}`);
            }

            if (!found) {
                await new Promise<void>((resolve) => setTimeout(resolve, 2000));
            }
        }

        if (found) {
            await logger.info(nodeId, `Pattern found in logs: ${matchedLine.slice(0, 200)}`);
            if (failIfFound) {
                throw new Error(`Pattern "${pattern}" was found in container logs (failIfFound = true)`);
            }
            return { success: true, output: { found: true, matchedLine, containerName } };
        } else {
            await logger.info(nodeId, `Pattern not found in container logs within ${timeout}s`);
            if (!failIfFound) {
                throw new Error(`Pattern "${pattern}" was not found in container "${containerName}" logs within ${timeout}s`);
            }
            return { success: true, output: { found: false, containerName } };
        }
    }
}

export const checkContainerLogsExecutor = new CheckContainerLogsExecutor();
