import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';

export class BuildDockerImageExecutor implements INodeExecutor {
    readonly type = 'build-docker-image';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, allOutputs, logger, nodeId, abortSignal } = ctx;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Clone Repository node',
            );
        }

        const dockerfilePath =
            (ctx.nodeConfig.dockerfilePath as string | undefined) ?? 'Dockerfile';

        const imageName = config.imageName;

        await logger.info(nodeId, `Building Docker image: ${imageName}`);

        const onLog = async (message: string) => {
            await logger.info(nodeId, message);
        };

        const branch = getFromAllOutputs<string>(allOutputs, 'branch');
        const commitHash = getFromAllOutputs<string>(allOutputs, 'commitHash');
        const commitMessage = getFromAllOutputs<string>(allOutputs, 'commitMessage');

        const labels: Record<string, string> = {
            [NEXPLOY_LABELS.repositoryId]: config.repositoryId,
            [NEXPLOY_LABELS.buildId]: config.imageTag,
            [NEXPLOY_LABELS.imageTag]: config.imageTag,
            ...(branch && { [NEXPLOY_LABELS.branch]: branch }),
            ...(commitHash && { [NEXPLOY_LABELS.commitHash]: commitHash }),
            ...(commitMessage && { [NEXPLOY_LABELS.commitMessage]: commitMessage }),
        };

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        try {
            const result = await dockerService.buildImage(
                workDir,
                imageName,
                dockerfilePath,
                abortSignal,
                onLog,
                environmentId,
                labels,
            );

            await logger.info(
                nodeId,
                `Docker image built successfully${result.imageId ? `: ${result.imageId.slice(0, 12)}` : ''}`,
            );

            return {
                success: true,
                output: {
                    imageId: result.imageId,
                    imageName,
                },
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            throw new Error(
                `Docker build failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const buildDockerImageExecutor = new BuildDockerImageExecutor();
