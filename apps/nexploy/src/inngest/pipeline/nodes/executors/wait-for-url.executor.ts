import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { waitForUrlConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class WaitForUrlExecutor implements INodeExecutor {
    readonly type = 'wait-for-url';
    readonly configSchema = waitForUrlConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof waitForUrlConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const url = nodeConfig.url;
        const expectedStatus = nodeConfig.expectedStatus;
        const timeout = nodeConfig.timeout;
        const interval = nodeConfig.interval;
        const method = nodeConfig.method;

        await logger.info(
            nodeId,
            `Waiting for ${method} ${url} to return ${expectedStatus} (timeout: ${timeout}s)`,
        );

        const deadline = Date.now() + timeout * 1000;

        while (Date.now() < deadline) {
            if (abortSignal.aborted) throw new Error('Aborted');

            try {
                const response = await fetch(url, { method, signal: abortSignal });
                if (response.status === expectedStatus) {
                    await logger.info(nodeId, `URL ${url} returned ${response.status}`);
                    return { output: { url, status: response.status } };
                }
                await logger.debug(
                    nodeId,
                    `Got ${response.status}, expected ${expectedStatus}, retrying in ${interval}s`,
                );
            } catch (err) {
                if (abortSignal.aborted) throw new Error('Aborted');
                await logger.debug(
                    nodeId,
                    `Request failed: ${err instanceof Error ? err.message : 'unknown error'}`,
                );
            }

            await new Promise<void>((resolve) => setTimeout(resolve, interval * 1000));
        }

        throw new Error(`URL ${url} did not return ${expectedStatus} within ${timeout}s`);
    }
}

export const waitForUrlExecutor = new WaitForUrlExecutor();
