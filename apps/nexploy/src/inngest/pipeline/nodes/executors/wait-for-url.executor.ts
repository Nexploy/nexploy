import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';

export class WaitForUrlExecutor implements INodeExecutor {
    readonly type = 'wait-for-url';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const url = nodeConfig.url as string;
        if (!url) throw new Error('URL is required');

        const expectedStatus = (nodeConfig.expectedStatus as number | undefined) ?? 200;
        const timeout = (nodeConfig.timeout as number | undefined) ?? 60;
        const interval = (nodeConfig.interval as number | undefined) ?? 5;
        const method = (nodeConfig.method as string | undefined) ?? 'GET';

        await logger.info(nodeId, `Waiting for ${method} ${url} to return ${expectedStatus} (timeout: ${timeout}s)`);

        const deadline = Date.now() + timeout * 1000;

        while (Date.now() < deadline) {
            if (abortSignal.aborted) throw new Error('Aborted');

            try {
                const response = await fetch(url, { method, signal: abortSignal });
                if (response.status === expectedStatus) {
                    await logger.info(nodeId, `URL ${url} returned ${response.status}`);
                    return { success: true, output: { url, status: response.status } };
                }
                await logger.debug(nodeId, `Got ${response.status}, expected ${expectedStatus}, retrying in ${interval}s`);
            } catch (err) {
                if (abortSignal.aborted) throw new Error('Aborted');
                await logger.debug(nodeId, `Request failed: ${err instanceof Error ? err.message : 'unknown error'}`);
            }

            await new Promise<void>((resolve) => setTimeout(resolve, interval * 1000));
        }

        throw new Error(`URL ${url} did not return ${expectedStatus} within ${timeout}s`);
    }
}

export const waitForUrlExecutor = new WaitForUrlExecutor();
