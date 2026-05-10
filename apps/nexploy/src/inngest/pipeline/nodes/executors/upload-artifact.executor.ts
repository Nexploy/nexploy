import * as fs from 'node:fs';
import * as path from 'node:path';
import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { uploadArtifactConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { safeResolvePath } from '@workspace/shared/pathSafety';
import { createS3Client, putS3Object } from '@/lib/aws/s3';
import { z } from 'zod';

export class UploadArtifactExecutor
    implements INodeExecutor
{
    readonly type = 'upload-artifact';
    readonly configSchema = uploadArtifactConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof uploadArtifactConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, edges } = ctx;

        const {
            endpoint,
            bucket,
            accessKey,
            secretKey,
            region,
            sourcePath,
            destinationPath,
            useSSL,
        } = nodeConfig;

        const credentials = { accessKeyId: accessKey, secretAccessKey: secretKey, region };
        const protocol = useSSL ? 'https' : 'http';
        const endpointUrl = `${protocol}://${endpoint.replace(/^https?:\/\//, '')}`;
        const s3 = createS3Client(credentials, endpointUrl);

        const uploadS3 = (objectKey: string, fileBuffer: Buffer) =>
            putS3Object(s3, bucket, objectKey, fileBuffer, 'application/octet-stream');

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        const base = workDir ?? process.cwd();
        const resolvedSource = safeResolvePath(base, sourcePath);

        await logger.info(nodeId, `Uploading ${sourcePath} → s3://${bucket}/${destinationPath}`);

        const stats = fs.statSync(resolvedSource);

        if (stats.isDirectory()) {
            const files = fs.readdirSync(resolvedSource, { recursive: true }) as string[];
            let uploaded = 0;
            for (const file of files) {
                const fullPath = path.join(resolvedSource, file);
                if (fs.statSync(fullPath).isFile()) {
                    const objectKey = path.posix.join(destinationPath, file.replace(/\\/g, '/'));
                    await uploadS3(objectKey, fs.readFileSync(fullPath));
                    uploaded++;
                    await logger.debug(nodeId, `Uploaded: ${objectKey}`);
                }
            }
            await logger.info(
                nodeId,
                `Uploaded ${uploaded} files to s3://${bucket}/${destinationPath}`,
            );
            return { output: { uploaded, bucket, destinationPath } };
        } else {
            await uploadS3(destinationPath, fs.readFileSync(resolvedSource));
            await logger.info(nodeId, `Uploaded to s3://${bucket}/${destinationPath}`);
            return { output: { uploaded: 1, bucket, destinationPath } };
        }
    }
}

export const uploadArtifactExecutor = new UploadArtifactExecutor();
