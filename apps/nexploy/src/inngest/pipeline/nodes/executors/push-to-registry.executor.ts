import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    getFromInputs,
    getFromAllOutputs,
} from '@/types/pipeline.type';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { getDefaultRegistry } from '@/services/registry.service';

export class PushToRegistryExecutor implements INodeExecutor {
    readonly type = 'push-to-registry';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, inputOutputs, allOutputs, logger, nodeId, nodeConfig, abortSignal } = ctx;

        // Look for imageName from inputs, then all outputs, then global config
        const imageName =
            getFromInputs<string>(inputOutputs, 'imageName') ??
            getFromAllOutputs<string>(allOutputs, 'imageName') ??
            config.imageName;

        if (!imageName) {
            throw new Error(
                'No imageName found — connect this node after a Build Docker Image node',
            );
        }

        const registry = await getDefaultRegistry();
        if (!registry) {
            throw new Error(
                'No default registry configured. Please configure a Docker registry in Admin > Registry.',
            );
        }

        const customTag = (nodeConfig.tag as string | undefined) ?? config.gitCommitHash ?? 'latest';
        const baseImageName = imageName.split(':')[0];
        const targetName = `${registry.url}/${baseImageName}:${customTag}`;

        await logger.info(nodeId, `Pushing image to registry: ${targetName}`);

        const onLog = async (message: string) => logger.info(nodeId, message);

        try {
            const result = await dockerService.pushToRegistry(
                imageName,
                targetName,
                {
                    serveraddress: registry.url,
                    username: registry.username || '',
                    password: registry.password || '',
                },
                config.imageTag,
                abortSignal,
                onLog,
                config.environmentId,
            );

            await logger.info(nodeId, `Image pushed successfully: ${result.targetName}`);

            return {
                success: true,
                output: {
                    targetName: result.targetName,
                    registryUrl: registry.url,
                    tag: customTag,
                },
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            throw new Error(
                `Push to registry failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const pushToRegistryExecutor = new PushToRegistryExecutor();
