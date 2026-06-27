import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, KyDockerOptions } from '@/lib/api/kyDocker';
import { createBucketStorageClient, putBucketStorageObject } from '@/lib/bucket-storage/bucketStorage';
import { getBucketStorageCredentials } from '@/services/bucketStorage.service';
import { backupVolumeBucketStorageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class BackupVolumeBucketStorageExecutor implements INodeExecutor {
    readonly type = 'backup-volume-bucket-storage';
    readonly configSchema = backupVolumeBucketStorageConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof backupVolumeBucketStorageConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, allOutputs, logger, abortSignal, edges } = ctx;

        const volumeName = nodeConfig.volumeName;
        const accountId = nodeConfig.accountId;
        const bucket = nodeConfig.bucket;
        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(nodeId, `Fetching AWS credentials for account ${accountId}`);
        const creds = await getBucketStorageCredentials(accountId);

        await logger.info(nodeId, `Downloading volume archive: ${volumeName}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const buffer = await kyDocker
            .get(`backups/download/${encodeURIComponent(volumeName)}`, {
                timeout: false,
                environmentId,
            } as KyDockerOptions)
            .arrayBuffer();

        const fileName = `${volumeName}-${Date.now()}.tar.gz`;

        await logger.info(
            nodeId,
            `Uploading ${fileName} to ${bucket} (${buffer.byteLength} bytes)`,
        );
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const client = createBucketStorageClient(creds);
        await putBucketStorageObject(client, bucket, fileName, new Uint8Array(buffer), 'application/gzip');

        await logger.info(nodeId, `Volume backup uploaded successfully: ${fileName}`);

        return {
            output: { fileName, bucket, volumeName },
        };
    }
}

export const backupVolumeBucketStorageExecutor = new BackupVolumeBucketStorageExecutor();
