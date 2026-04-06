import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { downloadFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class DownloadFileExecutor implements INodeExecutor {
    readonly type = 'download-file';
    readonly configSchema = downloadFileConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const url = nodeConfig.url as string;
        const destinationPath = nodeConfig.destinationPath as string;
        const filename = nodeConfig.filename as string | undefined;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const base = workDir ?? process.cwd();

        const resolvedDest = path.isAbsolute(destinationPath)
            ? destinationPath
            : path.join(base, destinationPath);

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
