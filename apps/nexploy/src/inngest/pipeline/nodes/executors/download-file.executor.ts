import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { downloadFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { safeResolvePath } from '@workspace/shared/pathSafety';
import { z } from 'zod';

export class DownloadFileExecutor implements INodeExecutor {
    readonly type = 'download-file';
    readonly configSchema = downloadFileConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof downloadFileConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const url = nodeConfig.url;
        const destinationPath = nodeConfig.destinationPath;
        const filename = nodeConfig.filename;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        const base = workDir ?? process.cwd();

        const resolvedDest = safeResolvePath(base, destinationPath);

        const finalFilename =
            filename ?? (path.basename(new URL(url).pathname) || 'downloaded-file');
        const outputFile = path.join(resolvedDest, finalFilename);

        await logger.info(
            nodeId,
            `Downloading ${url} → ${path.join(destinationPath, finalFilename)}`,
        );

        const response = await fetch(url, { signal: abortSignal });
        if (!response.ok) {
            throw new Error(`Download failed: HTTP ${response.status} ${response.statusText}`);
        }

        await fs.mkdir(resolvedDest, { recursive: true });

        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.writeFile(outputFile, buffer);

        const sizeKb = (buffer.byteLength / 1024).toFixed(1);
        await logger.info(
            nodeId,
            `Downloaded ${sizeKb} KB to ${path.join(destinationPath, finalFilename)}`,
        );

        return {
            output: {
                url,
                outputFile,
                filename: finalFilename,
                sizeBytes: buffer.byteLength,
            },
        };
    }
}

export const downloadFileExecutor = new DownloadFileExecutor();
