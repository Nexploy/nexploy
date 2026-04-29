import { getFromClosestAncestor } from '@/types/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, KyDockerOptions } from '@/lib/api/kyDocker';
import { kyS3 } from '@/lib/api/kyS3';
import { tokenAwsStorage } from '@/lib/storage/token-aws-storage';
import { getAwsCredentials } from '@/services/aws.service';
import { backupVolumeS3ConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { HTTPError } from 'ky';
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
        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        await logger.info(nodeId, `Fetching AWS credentials for account ${accountId}`);
        const creds = await getAwsCredentials(accountId);

        await logger.info(nodeId, `Downloading volume archive: ${volumeName}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        const buffer = await kyDocker
            .get(`backups/download/${encodeURIComponent(volumeName)}`, {
                timeout: false,
                environmentId,
            } as KyDockerOptions)
            .arrayBuffer();

        const fileName = `${volumeName}-${Date.now()}.tar.gz`;
        const url = `https://${bucket}.s3.${creds.region}.amazonaws.com/${fileName}`;

        await logger.info(
            nodeId,
            `Uploading ${fileName} to s3://${bucket} (${buffer.byteLength} bytes)`,
        );
        if (abortSignal.aborted) throw new Error('Build cancelled');

        try {
            await tokenAwsStorage.run(creds, () =>
                kyS3.put(url, {
                    body: new Uint8Array(buffer),
                    headers: {
                        'Content-Type': 'application/gzip',
                        'Content-Length': String(buffer.byteLength),
                    },
                }),
            );
        } catch (err) {
            if (err instanceof HTTPError) {
                const status = err.response.status;
                const hints: Record<number, string> = {
                    403: 'Check that the AWS credentials have s3:PutObject permission on this bucket.',
                    404: `Bucket "${bucket}" not found in region "${creds.region}". Verify the bucket name and region.`,
                    301: `Wrong region — the bucket may be in a different region than "${creds.region}".`,
                };
                const hint = hints[status] ?? 'Check your S3 configuration.';
                throw new Error(
                    `S3 upload failed with status ${status} ${err.response.statusText}: PUT ${url} — ${hint}`,
                );
            }
            throw err;
        }

        await logger.info(nodeId, `Volume backup uploaded successfully: ${fileName}`);

        return {
            output: { fileName, bucket, volumeName },
        };
    }
}

export const backupVolumeS3Executor = new BackupVolumeS3Executor();
