import { lookup } from 'dns/promises';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { httpRequestConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

const PRIVATE_IP_RE = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^::1$/,
    /^f[cd][0-9a-f]{2}:/i,
];

async function assertUrlSafe(rawUrl: string): Promise<void> {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error(`Invalid URL: ${rawUrl}`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Protocol not allowed: ${parsed.protocol}`);
    }

    let ip: string;
    try {
        const result = await lookup(parsed.hostname);
        ip = result.address;
    } catch {
        throw new Error(`Cannot resolve hostname: ${parsed.hostname}`);
    }

    if (PRIVATE_IP_RE.some((re) => re.test(ip))) {
        throw new Error('Requests to private or internal addresses are not allowed');
    }
}

export class HttpRequestExecutor implements INodeExecutor {
    readonly type = 'http-request';
    readonly configSchema = httpRequestConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof httpRequestConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, logger, nodeId, abortSignal } = ctx;

        const {
            url,
            method,
            headers: headersArr,
            body,
            expectedStatus,
            continueOnError,
        } = nodeConfig;

        const headers: Record<string, string> = {};
        for (const header of headersArr) {
            if (header.key) headers[header.key] = header.value;
        }

        await logger.info(nodeId, `${method} ${url}`);

        try {
            await assertUrlSafe(url);

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
                    return { output: { status: response.status, continued: true }, skipped: false };
                }
                throw new Error(msg);
            }

            await logger.info(nodeId, `HTTP request completed successfully`);
            return { output: { status: response.status, body: responseText.slice(0, 1000) } };
        } catch (error) {
            if ((error as Error).name === 'AbortError') throw new Error('Aborted');
            const msg = error instanceof Error ? error.message : 'Unknown error';
            if (continueOnError) {
                await logger.warn(
                    nodeId,
                    `Request failed: ${msg} (continuing due to continueOnError)`,
                );
                return { output: { failed: true, error: msg }, skipped: false };
            }
            throw new Error(`HTTP request failed: ${msg}`);
        }
    }
}

export const httpRequestExecutor = new HttpRequestExecutor();
