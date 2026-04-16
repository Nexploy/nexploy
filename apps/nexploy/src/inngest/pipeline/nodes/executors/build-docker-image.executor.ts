import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    
} from '@/types/pipeline.type';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';
import { buildDockerImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class BuildDockerImageExecutor implements INodeExecutor {
    readonly type = 'build-docker-image';
    readonly configSchema = buildDockerImageConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof buildDockerImageConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { buildConfig, allOutputs, logger, nodeId, abortSignal, nodeConfig } = ctx;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Clone Repository node',
            );
        }

        const dockerfileName = nodeConfig.dockerfilePath;
        const dockerfileFilePath = nodeConfig.dockerfileFilePath;
        const dockerfilePath = dockerfileFilePath
            ? `${dockerfileFilePath.replace(/\/$/, '')}/${dockerfileName}`
            : dockerfileName;

        const imageName = `${buildConfig.imageName}-${nodeId}`;

        await logger.info(nodeId, `Building Docker image: ${imageName}`);

        const onLog = async (message: string) => {
            await logger.info(nodeId, message);
        };

        const branch = getFromAllOutputs<string>(allOutputs, 'branch');
        const commitHash = getFromAllOutputs<string>(allOutputs, 'commitHash');
        const commitMessage = getFromAllOutputs<string>(allOutputs, 'commitMessage');

        const labels: Record<string, string> = {
            [NEXPLOY_LABELS.repositoryId]: buildConfig.repositoryId,
            [NEXPLOY_LABELS.buildId]: buildConfig.buildId,
            [NEXPLOY_LABELS.imageTag]: buildConfig.buildId,
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
