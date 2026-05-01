import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { getRegistryWithPassword } from '@/services/registry.service';
import { pullFromRegistryConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

const DOCKER_HUB = 'docker-hub';

export class PullFromRegistryExecutor implements INodeExecutor {
    readonly type = 'pull-from-registry';
    readonly configSchema = pullFromRegistryConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof pullFromRegistryConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, edges } = ctx;

        const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');

        let fullImageName: string;
        let auth: { serveraddress: string; username: string; password: string } | undefined;

        if (!nodeConfig.registryId || nodeConfig.registryId === DOCKER_HUB) {
            fullImageName = nodeConfig.imageName;
            await logger.info(nodeId, `Pulling image ${fullImageName} from Docker Hub`);
        } else {
            const registry = await getRegistryWithPassword(nodeConfig.registryId);
            if (!registry) {
                throw new Error(
                    'Registry not found. Please select a valid registry in the node configuration or add one in Admin > Registry.',
                );
            }
            auth = {
                serveraddress: registry.url,
                username: registry.username || '',
                password: registry.password || '',
            };
            fullImageName = `${registry.url}/${nodeConfig.imageName}`;
            await logger.info(nodeId, `Pulling image ${fullImageName} from ${registry.url}`);
        }

        try {
            await kyDocker
                .post('images/pull', {
                    json: { imageName: fullImageName, ...(auth ? { auth } : {}) },
                    signal: abortSignal,
                    environmentId,
                } as KyDockerOptions)
                .json();
        } catch (error) {
            const msg = error instanceof Error ? error.message.toLowerCase() : '';
            if (msg.includes('already') || msg.includes('existe')) {
                await logger.info(nodeId, `Image already exists locally: ${fullImageName}`);
                return { output: { imageName: fullImageName }, skipped: true };
            }
            throw new Error(
                `Failed to pull image: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }

        await logger.info(nodeId, `Image pulled successfully: ${fullImageName}`);

        return {
            output: {
                imageName: fullImageName,
            },
        };
    }
}

export const pullFromRegistryExecutor = new PullFromRegistryExecutor();
