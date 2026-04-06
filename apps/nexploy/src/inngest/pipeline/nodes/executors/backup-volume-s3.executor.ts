import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker } from '@/lib/api/kyDocker';
import { kyS3 } from '@/lib/api/kyS3';
import { tokenAwsStorage } from '@/lib/storage/token-aws-storage';
import { getAwsCredentials } from '@/services/aws.service';
import { backupVolumeS3ConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class BackupVolumeS3Executor implements INodeExecutor {
    readonly type = 'backup-volume-s3';
    readonly configSchema = backupVolumeS3ConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, allOutputs, logger, abortSignal } = ctx;

        const volumeName =
            (nodeConfig.volumeName as string | undefined)?.trim() ||
            getFromAllOutputs<string>(allOutputs, 'volumeName') ||
            '';
        const accountId = nodeConfig.accountId as string;
        const bucket = nodeConfig.bucket as string;

        if (!volumeName) throw new Error('No volume name provided');

        await logger.info(nodeId, `Fetching AWS credentials for account ${accountId}`);
        const creds = await getAwsCredentials(accountId);

        await logger.info(nodeId, `Downloading volume archive: ${volumeName}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const buffer = await kyDocker
            .get(`backups/download/${encodeURIComponent(volumeName)}`, { timeout: false })
            .arrayBuffer();

        const objectKey = `${volumeName}-${Date.now()}.tar.gz`;
        const url = `https://${bucket}.s3.${creds.region}.amazonaws.com/${objectKey}`;

        await logger.info(
            nodeId,
            `Uploading ${objectKey} to s3://${bucket} (${buffer.byteLength} bytes)`,
        );
        if (abortSignal.aborted) throw new Error('Build cancelled');

        await tokenAwsStorage.run(creds, () =>
            kyS3.put(url, {
                body: new Uint8Array(buffer),
                headers: {
                    'Content-Type': 'application/gzip',
                    'Content-Length': String(buffer.byteLength),
                },
            }),
        );

        await logger.info(nodeId, `Volume backup uploaded successfully: ${objectKey}`);

        return {
            output: { objectKey, bucket, volumeName },
        };
    }
}

export const backupVolumeS3Executor = new BackupVolumeS3Executor();
