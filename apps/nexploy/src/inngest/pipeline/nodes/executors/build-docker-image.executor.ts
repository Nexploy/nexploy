import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
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
        const { buildConfig, allOutputs, logger, nodeId, abortSignal, nodeConfig, edges } = ctx;

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        if (!workDir) {
            throw new Error(
                'No workDir found in input nodes — connect this node after a Source node',
            );
        }

        const dockerfileName = nodeConfig.dockerfilePath;
        const dockerfileFilePath = nodeConfig.dockerfileFilePath;
        const dockerfilePath = dockerfileFilePath
            ? `${dockerfileFilePath.replace(/\/$/, '')}/${dockerfileName}`
            : dockerfileName;

        const repositorySlug = `nexploy-${buildConfig.repositoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        const customImageName = nodeConfig.imageName?.trim();
        const imageName = customImageName
            ? customImageName.includes(':')
                ? customImageName
                : `${customImageName}:${buildConfig.buildId}`
            : `${repositorySlug}-${nodeId}:${buildConfig.buildId}`;

        await logger.info(nodeId, `Building Docker image: ${imageName}`);

        const onLog = async (message: string) => {
            await logger.info(nodeId, message);
        };

        const branch = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'branch');
        const commitHash = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'commitHash');
        const commitMessage = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'commitMessage',
        );

        const labels: Record<string, string> = {
            [NEXPLOY_LABELS.repositoryId]: buildConfig.repositoryId,
            [NEXPLOY_LABELS.buildId]: buildConfig.buildId,
            ...(branch && { [NEXPLOY_LABELS.branch]: branch }),
            ...(commitHash && { [NEXPLOY_LABELS.commitHash]: commitHash }),
            ...(commitMessage && { [NEXPLOY_LABELS.commitMessage]: commitMessage }),
        };

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

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
