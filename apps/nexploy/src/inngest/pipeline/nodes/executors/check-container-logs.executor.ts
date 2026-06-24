import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { checkContainerLogsConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';

const DURATION_UNITS: Record<'s' | 'm' | 'h' | 'd', number> = { s: 1, m: 60, h: 3600, d: 86400 };

function parseSinceDuration(since: string): number {
    const relative = since.match(/^(\d+)(s|m|h|d)$/);
    if (relative) {
        const [, rawAmount, unit] = relative as [string, string, 's' | 'm' | 'h' | 'd'];
        return Math.floor(Date.now() / 1000) - parseInt(rawAmount, 10) * DURATION_UNITS[unit];
    }
    const ts = Date.parse(since);
    if (!isNaN(ts)) return Math.floor(ts / 1000);
    return Math.floor(Date.now() / 1000);
}

export class CheckContainerLogsExecutor implements INodeExecutor {
    readonly type = 'check-container-logs';
    readonly configSchema = checkContainerLogsConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof checkContainerLogsConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const containerId = nodeConfig.containerId;
        const pattern = nodeConfig.pattern;
        const since = nodeConfig.since;
        const timeout = nodeConfig.timeout;
        const failIfFound = nodeConfig.failIfFound;

        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');
        const regex = new RegExp(pattern);
        const sinceTimestamp = since ? parseSinceDuration(since) : undefined;

        await logger.info(
            nodeId,
            `Checking logs of container "${containerId}" for pattern: ${pattern} with since : ${since} (timeout: ${timeout}s)`,
        );

        const deadline = Date.now() + timeout * 1000;
        let found = false;
        let matchedLine = '';

        while (Date.now() < deadline && !found) {
            if (abortSignal.aborted) throw new Error('Aborted');

            try {
                const result = await kyDocker
                    .get(`container/${containerId}/logs`, {
                        searchParams: {
                            tail: '100',
                            ...(sinceTimestamp !== undefined && { since: `${sinceTimestamp}` }),
                        },
                        signal: abortSignal,
                        environmentId,
                    } as KyDockerOptions)
                    .json<{ logs: string }>();

                const lines = result.logs.split('\n');
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
            return { output: { found: true, matchedLine, containerId } };
        } else {
            await logger.info(nodeId, `Pattern not found in container logs within ${timeout}s`);
            if (!failIfFound) {
                throw new Error(
                    `Pattern "${pattern}" was not found in container "${containerId}" logs within ${timeout}s`,
                );
            }
            return { output: { found: false, containerId } };
        }
    }
}

export const checkContainerLogsExecutor = new CheckContainerLogsExecutor();
