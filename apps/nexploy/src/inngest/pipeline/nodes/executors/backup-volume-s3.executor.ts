import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@workspace/typescript-interface/pipeline/pipeline';
import { kyDocker, KyDockerOptions } from '@/lib/api/kyDocker';
import { createS3Client, putS3Object } from '@/lib/s3/s3';
import { getS3Credentials } from '@/services/s3.service';
import { backupVolumeS3ConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class BackupVolumeS3Executor implements INodeExecutor {
    readonly type = 'backup-volume-s3';
    readonly configSchema = backupVolumeS3ConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof backupVolumeS3ConfigSchema>>>,
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
        const creds = await getS3Credentials(accountId);

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
            `Uploading ${fileName} to s3://${bucket} (${buffer.byteLength} bytes)`,
        );
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const s3 = createS3Client(creds);
        await putS3Object(s3, bucket, fileName, new Uint8Array(buffer), 'application/gzip');

        await logger.info(nodeId, `Volume backup uploaded successfully: ${fileName}`);

        return {
            output: { fileName, bucket, volumeName },
        };
    }
}

export const backupVolumeS3Executor = new BackupVolumeS3Executor();
