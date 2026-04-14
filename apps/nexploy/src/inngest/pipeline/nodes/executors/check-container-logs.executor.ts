import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    ResolvedConfig,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { checkContainerLogsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class CheckContainerLogsExecutor implements INodeExecutor {
    readonly type = 'check-container-logs';
    readonly configSchema = checkContainerLogsConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolvedConfig<z.infer<typeof checkContainerLogsConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const containerName = nodeConfig.containerName;
        const pattern = nodeConfig.pattern;
        const since = nodeConfig.since;
        const timeout = nodeConfig.timeout;
        const failIfFound = nodeConfig.failIfFound;

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const regex = new RegExp(pattern);

        await logger.info(
            nodeId,
            `Checking logs of container "${containerName}" for pattern: ${pattern}`,
        );

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
                await logger.debug(
                    nodeId,
                    `Log fetch error: ${err instanceof Error ? err.message : 'unknown'}`,
                );
            }

            if (!found) {
                await new Promise<void>((resolve) => setTimeout(resolve, 2000));
            }
        }

        if (found) {
            await logger.info(nodeId, `Pattern found in logs: ${matchedLine.slice(0, 200)}`);
            if (failIfFound) {
                throw new Error(
                    `Pattern "${pattern}" was found in container logs (failIfFound = true)`,
                );
            }
            return { output: { found: true, matchedLine, containerName } };
        } else {
            await logger.info(nodeId, `Pattern not found in container logs within ${timeout}s`);
            if (!failIfFound) {
                throw new Error(
                    `Pattern "${pattern}" was not found in container "${containerName}" logs within ${timeout}s`,
                );
            }
            return { output: { found: false, containerName } };
        }
    }
}

export const checkContainerLogsExecutor = new CheckContainerLogsExecutor();
