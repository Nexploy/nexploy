import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { httpRequestConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

interface HeaderEntry {
    id: string;
    key: string;
    value: string;
}

export class HttpRequestExecutor implements INodeExecutor {
    readonly type = 'http-request';
    readonly configSchema = httpRequestConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const url = nodeConfig.url as string;
        if (!url) throw new Error('URL is required');

        const method = (nodeConfig.method as string | undefined) ?? 'POST';
        const headersArr = (nodeConfig.headers as HeaderEntry[] | undefined) ?? [];
        const body = nodeConfig.body as string | undefined;
        const expectedStatus = (nodeConfig.expectedStatus as number | undefined) ?? 200;
        const continueOnError = (nodeConfig.continueOnError as boolean | undefined) ?? false;

        const headers: Record<string, string> = {};
        for (const h of headersArr) {
            if (h.key) headers[h.key] = h.value;
        }
        if (body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        await logger.info(nodeId, `${method} ${url}`);

        try {
            const response = await fetch(url, {
                method,
                headers,
                ...(body && method !== 'GET' && method !== 'HEAD' ? { body } : {}),
                signal: abortSignal,
            });

            const responseText = await response.text().catch(() => '');
            await logger.info(nodeId, `Response: ${response.status} ${response.statusText}`);
            if (responseText) await logger.debug(nodeId, responseText.slice(0, 500));

            if (response.status !== expectedStatus) {
                const msg = `HTTP request returned ${response.status}, expected ${expectedStatus}`;
                if (continueOnError) {
                    await logger.warn(nodeId, `${msg} (continuing due to continueOnError)`);
                    return { success: true, output: { status: response.status, continued: true }, skipped: false };
                }
                throw new Error(msg);
            }

            await logger.info(nodeId, `HTTP request completed successfully`);
            return { success: true, output: { status: response.status, body: responseText.slice(0, 1000) } };
        } catch (error) {
            if ((error as Error).name === 'AbortError') throw new Error('Aborted');
            const msg = error instanceof Error ? error.message : 'Unknown error';
            if (continueOnError) {
                await logger.warn(nodeId, `Request failed: ${msg} (continuing due to continueOnError)`);
                return { success: true, output: { failed: true, error: msg }, skipped: false };
            }
            throw new Error(`HTTP request failed: ${msg}`);
        }
    }
}

export const httpRequestExecutor = new HttpRequestExecutor();
